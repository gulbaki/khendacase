const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');


const app = express();

// Middleware for parsing JSON request bodies
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// GET endpoint to retrieve video analysis data
app.get('/api/v1/video-analysis/:id', (req, res) => {
  try {
    const id = req.params.id;
    const rawData = fs.readFileSync(`${id}.json`);
    const videoData = JSON.parse(rawData);

    const stateChangeArray = processSoftMaxResults(videoData);

    res.json({
      rawResults: videoData,
      stateChangeArray,
    });
  } catch (error) {
    console.error('Error processing video analysis:', error);
    res.status(500).json({ error: 'An error occurred while processing video analysis' });
  }
});

function processSoftMaxResults(results) {
  const states = Object.keys(results);
  const stateChangeArray = [];
  const consecutiveThreshold = 3;

  states.forEach((state) => {
    const frames = results[state];
    let currentState = null;
    let startTime = 0;

    for (let i = 0; i < frames.length; i++) {
      if (frames[i] > 0.9) {
        if (!currentState) {
          currentState = state;
          startTime = i;
        }
      } else {
        if (currentState) {
            console.log(i - startTime)
          if (i - startTime >= consecutiveThreshold) {
            const endTime = i - 1;
            const uuid = uuidv4();
            stateChangeArray.push({
              uuid,
              stepName: currentState,
              startTime,
              endTime,
            });
            
          }

          currentState = null;
        }
      }
    }

    if (currentState) {
      const endTime = frames.length - 1;
      const uuid = uuidv4();
      stateChangeArray.push({
        uuid,
        stepName: currentState,
        startTime,
        endTime,
      });
    }
  });

  return stateChangeArray;
}

app.listen(3003, () => {
  console.log('Server listening on port 3003');
});
