// 引用linebot SDK
var linebot = require('linebot');
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'asd0802e',
  database: 'HIT2',
  port: 3306
});

connection.connect(function(err) {
  if (err) throw err;
  console.log('Connected to MySQL');
});


// 用於辨識Line Channel的資訊
var bot = linebot({
  channelId: 'U08acfbaecf53f8cd4e24f460ad3f7a63',
  channelSecret: '92e1e35390e3031cb70c94999bade996',
  channelAccessToken: 'P2nPQKHj3EYsnr8WbSDv7LLa5K3E7hYvjehynto/YDdTadq4OTqxNiAT+pgaXM941YSGG59MVyrbnirPWQZt0QPBePTUxgcW6DuX5LZ8hoZzXdgqkivwFTNHiRvrHnt6xYCML3vauJoJuH3fzA/uawdB04t89/1O/w1cDnyilFU='
});

bot.on('message', function (event) {
    var userMessage = event.message.text;
  
    // Check if the message has the correct format
    if (userMessage.includes(' 死')) {
      // Split the message into parts
      var parts = userMessage.split(' ');
  
      // Extract the values
      var bossid = parts[0];
      var deathTime = parts[2] || new Date(); // If blank, use current time
  
      // Query the respawn duration from the database
      var queryRespawnDuration = `
        SELECT respawn_duration
        FROM boss_times
        WHERE id = ? 
      `;
  
      connection.query(queryRespawnDuration, [bossid], function (err, result) {
        if (err) throw err;
  
        if (result.length > 0) {
          var respawnDuration = result[0].respawn_duration;
  
          // Calculate respawn time
          var respawnTime = new Date(deathTime.getTime() + respawnDuration);
  
          // Update the database
          var updateQuery = `
            UPDATE HIT2.boss_times
            SET death_time = ?, respawn_time = ?
            WHERE id = ? 
          `;
  
          connection.query(updateQuery, [deathTime, respawnTime, bossid], function (err, result) {
            if (err) throw err;
            console.log("Record updated");
          });
  
          // Send a reply to the user
          event.reply('BOSS 死亡時間已更新！').catch(function (error) {
            console.error(error);
          });
        } else 
        {
          // Handle the case where the boss is not found in the database
          event.reply('找不到指定的 BOSS。請檢查地點和頻道是否正確。').catch(function (error) {
            console.error(error);
          });
        }
      });
    }else if (userMessage === '王表') {
        // Query all the BOSS information from the database
        var queryAllBosses = `
          SELECT id,location, channel, respawn_time
          FROM boss_times
        `;
    
        connection.query(queryAllBosses, function (err, result) {
            if (err) throw err;
      
            // Build the reply message
            var replyMsg = result.map(row => {
              var respawnTime = new Date(row.respawn_time);
              var formattedHours = respawnTime.getHours().toString().padStart(2, '0');
              var formattedMinutes = respawnTime.getMinutes().toString().padStart(2, '0');
              return `${row.id} ${row.location} ${row.channel} ${formattedHours}:${formattedMinutes}`;
            }).join('\n');
    
          // Send the reply to the user
          event.reply(replyMsg).catch(function (error) {
            console.error(error);
          });
        });
      }
  });
  

// Bot所監聽的webhook路徑與port
bot.listen('/linewebhook', 3000, function () {
    console.log('[HIT2 BOSS BOT 已準備就緒]');
});