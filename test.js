var cron = require('node-cron');

cron.schedule('*/1 * * * *', () => {
  console.log('running a task every two minutes */1 * * * *');
});

//ทำงานทุกๆ 2 นาที
cron.schedule('*/2 * * * *', () => {
    console.log('running a task every two minutes */2 * * * *');
  });