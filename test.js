var cron = require('node-cron');


// //ทำงานทุกๆ 2 นาที
// cron.schedule('*/2 * * * *', () => {
//     console.log('running a task every two minutes */2 * * * *');
//   });

cron.schedule('25 13 * * *', () => {
  console.log("Load data pmii to Database success")
}, {
  scheduled: true,
  timezone: "Asia/Bangkok"
});