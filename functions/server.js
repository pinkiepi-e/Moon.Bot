const { MessageEmbed, Permissions } = require("discord.js");
const config = require("../config/config.json");

//prefix
module.exports.change_prefix_after_check = async(DBConnection, message, args) => {

    if(message.author.id !== message.guild.ownerID) return message.channel.send("**Prefix**: You cannot change the server prefix.");
    if(!args.length) return message.channel.send("**Prefix**: You have to put character to use it as a prefix.");

    let newPrefixCheck = args[1];

    if(!/[a-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]+$/i.test(newPrefixCheck)) return message.channel.send("**Prefix**: Prefix can contain only Alphabet, numbers and some special characters.");
    if(newPrefixCheck.length > 2) return message.channel.send("**Prefix**: Prefix can be long only 1 or 2 character(s) long.");
    
    DBConnection.query("REPLACE INTO `discord`.`servers` (server_id, server_prefix) VALUES("+message.guild.id+", '"+newPrefixCheck+"')");

    let SuccEmbed = new MessageEmbed()
        .setColor("#F9A3BB")
        .setTitle('Bot Settings => Prefix')
        .setDescription("New prefix: "+newPrefixCheck);

    message.channel.send({
        embeds: [SuccEmbed]
    });
    return;
};

module.exports.get_prefix_from_db = async(DBConnection, message) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT `server_prefix` FROM `discord`.`servers` WHERE `server_id` = '"+message.guild.id+"'", (error, checkprefix) => {

            if(error) reject(error);

            let prefix_parsed = JSON.parse(JSON.stringify(checkprefix));

            if(checkprefix.length == 0) {

                DBConnection.query("UPDATE `discord`.`servers` SET `server_prefix` = '"+config.client.prefix+"' WHERE `server_id` = '"+message.guild.id+"'");
                resolve(config.client.prefix);

            } else {

                resolve(prefix_parsed[0]["server_prefix"]);

            }
        });
    });
};

//Levels
module.exports.check_if_levels_are_enabled = async(DBConnection, message) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT `enabled_levels` FROM `discord`.`servers` WHERE `server_id` = '"+message.guild.id+"'", function (error, enabled_stats) {

            if(error) reject(error);

            resolve(enabled_stats);

        });
    });
};

module.exports.check_stats_for_lb = async(DBConnection, message) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT user_id, xp_level, xp_remain, xp_exp FROM `discord_levels`.`"+message.guild.id+"` ORDER BY xp_level DESC, xp_remain DESC LIMIT 10", function (error, lb_stats) {
            if(error) reject(error);
            resolve(lb_stats);
        });
    });
};

module.exports.check_lvl_user_stats = async(DBConnection, message) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT * FROM `discord_levels`.`"+message.guild.id+"` WHERE `user_id` = '"+message.author.id+"'", function (error, user_stats) {
            if(error) reject(error);
            resolve(user_stats);

        });
    });
};

module.exports.check_lvl_user_stats_forP = async(DBConnection, message, SelectedMember) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT * FROM `discord_levels`.`"+message.guild.id+"` WHERE `user_id` = '"+SelectedMember.id+"'", function (error, user_stats) {
            if(error) reject(error);
            resolve(user_stats);

        });
    });
};

module.exports.check_level_channel = async(DBConnection, message) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT `levels_channel` FROM `discord`.`servers` WHERE `server_id` = '"+message.guild.id+"'", function (error, level_channel) {
            if(error) reject(error);
            resolve(level_channel);

        });
    });
};

module.exports.delete_levels_table = (guild, DBConnection) => {

    DBConnection.query("DROP TABLE `discord_levels`.`"+guild.id+"`");

};

module.exports.create_levels_table = (guild, DBConnection, message) => {

    DBConnection.query("CREATE TABLE `discord_levels`.`"+guild.id+"` (user_id CHAR(50) PRIMARY KEY, xp_level INT(10) NOT NULL, xp_remain INT(10) NOT NULL, xp_exp INT(30) NOT NULL, last_xp BIGINT(20) NOT NULL)");
    DBConnection.query("INSERT INTO `discord_levels`.`"+guild.id+"` (`user_id`, `xp_level`, `xp_remain`, `xp_exp`, `last_xp`) VALUES ('"+message.author.id+"', '0', '0', '100', '"+Date.now()+"')");
    DBConnection.query("UPDATE `discord`.`servers` SET `levels_channel` = 'same', `enabled_levels` = 'yes' WHERE `server_id` = '"+guild.id+"'");

};

//mute functions
module.exports.check_if_mute_role_exists = async(DBConnection, message) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT `mute_roleid` FROM `discord`.`servers` WHERE `server_id` = '"+message.guild.id+"'", function (error, mute_role_id_result) {
            if(error) reject(error);
            let mute_role_id_result_parsed = JSON.parse(JSON.stringify(mute_role_id_result));

            if(mute_role_id_result_parsed === 0) {

                resolve(mute_role_id_result_parsed);

            } else {

                resolve(mute_role_id_result_parsed[0]["mute_role_id"]);

            }
        });

    });
};

module.exports.change_mute_role_db = async(DBConnection, message, RoleID) => {

    return DBConnection.query("UPDATE `discord`.`servers` SET `mute_roleid` = '"+RoleID+"' WHERE `server_id` = '"+message.guild.id+"'");

};

//query
module.exports.get_query = async(DBConnection, message, query) => {
    return new Promise((resolve, reject) => {

        DBConnection.query(query, function (error, result_of_query) {
            if(error) reject(error);

            let result_of_query_parsed = JSON.parse(JSON.stringify(result_of_query));

            console.log(result_of_query_parsed);

            if(result_of_query_parsed === 0) {

                resolve(result_of_query_parsed);

            } else {

                resolve(result_of_query_parsed);

            }
        });

    });
};

//Guild Join & Leave
module.exports.guildleave = (guild, DBConnection, client) => {

    DBConnection.query("DROP TABLE `discord_levels`.`"+guild.id+"`");
    client.channels.cache.get("833625728310444042").send("Removed Guild with ID: "+guild.id+" from Database.");
    
};

module.exports.guildjoin = (guild, DBConnection, client, message) => {

    DBConnection.query("CREATE TABLE `discord_levels`.`"+guild.id+"` (user_id CHAR(50) PRIMARY KEY, xp_level INT(10) NOT NULL, xp_remain INT(10) NOT NULL, xp_exp INT(30) NOT NULL, last_xp BIGINT(20) NOT NULL)");
    DBConnection.query("CREATE TABLE `discord_levels`.`"+guild.id+"` (user_id CHAR(50) PRIMARY KEY, xp_level INT(10) NOT NULL, xp_remain INT(10) NOT NULL, xp_exp INT(30) NOT NULL, last_xp BIGINT(20) NOT NULL)");
    DBConnection.query("UPDATE `discord_levels`.`"+guild.id+"` SET `xp_exp` = '100', `last_xp` = `"+Date.now()+"` WHERE `user_id` = '"+message.author.id+"'");
    DBConnection.query("UPDATE `discord`.`servers` SET `server_prefix` = '=', `levels_channel` = `same` WHERE `user_id` = '"+guild.id+"'");
    DBConnection.query("CREATE DATABASE `discord_warns_"+guild.id+"`");
    client.channels.cache.get("833625728310444042").send("Added Guild with ID: "+guild.id+" to Database.");

};

//music
module.exports.get_music_link = async(DBConnection, message, args) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT `song`, `artist`, `released`, `link` FROM `music`.`"+args[0]+"` WHERE `name` = '"+args[1]+"'", function (error, music_result) {
            if(error) reject(error);
            let music_result_parsed = JSON.parse(JSON.stringify(music_result));

            if(music_result_parsed === 0) {

                resolve(music_result_parsed);

            } else {

                resolve(music_result_parsed);

            }
        });

    });
};

module.exports.check_if_artist_exists = async(DBConnection, message, args) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'music' AND table_name = '"+args[0]+"S'", function (error, artist_result) {
            if(error) reject(error);

            if(artist_result === 0) {

                resolve(artist_result);

            } else {

                resolve(artist_result);

            }

        });

    });
};

module.exports.create_music_table = (DBConnection, message, ArtistShortName1) => {

    DBConnection.query("CREATE TABLE `music`.`"+ArtistShortName1+"` (name CHAR(50) PRIMARY KEY, song CHAR(50) NOT NULL, artist CHAR(50) NOT NULL, released CHAR(50) NOT NULL, link TEXT(200) NOT NULL)");

};

module.exports.check_if_song_exists = async(DBConnection, message, args) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT * FROM `music`.`"+args[0]+"` WHERE `name` = '"+args[1]+"'", function (error, song_result) {
            resolve(song_result);
        });

    });
};

module.exports.write_song_data = async(DBConnection, ShortArtistName1, ShortSongName1, SongName1, ArtistName1, ReleasedDate1, SongLink1) => {
    
    DBConnection.query("INSERT INTO `music`.`"+ShortArtistName1.content+"` VALUES ('"+ShortSongName1.content+"', '"+SongName1.content+"', '"+ArtistName1.content+"', '"+ReleasedDate1.content+"', '"+SongLink1.content+"')");
    
};

module.exports.artists_from_db = async(DBConnection) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SHOW TABLES FROM `music`", function (error, artists_list_from_db) {

            resolve(artists_list_from_db);

        });
    
    });
};

module.exports.get_music = async(DBConnection, args) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT `name`, `song` FROM `music`.`"+args[0]+"`", function (error, music_result_from_db) {

            resolve(music_result_from_db);

        });

    });
};

//What is it - Game
module.exports.check_game_data_wii = async(DBConnection, message) => {
    return new Promise((resolve, reject) => {

        DBConnection.query("SELECT * FROM `discord`.`whatisit` WHERE `guild_id` = '"+message.guild.id+"'", function (error, wii_stats) {
            
            resolve(wii_stats);

        });

    });
};

module.exports.send_wii_data = async(DBConnection, message, key_msg1, hint_msg1) => {
    DBConnection.query("INSERT INTO `discord`.`whatisit` (guild_id, pass, hint, first_guess, wrote) VALUES('"+message.guild.id+"', '"+key_msg1.content+"', '"+hint_msg1.content+"', '-', '"+message.author.id+"') ON DUPLICATE KEY UPDATE `pass` = '"+key_msg1.content+"', `hint` = '"+hint_msg1.content+"', `first_guess` = '-', `wrote` = '"+message.author.id+"'");
};

//poll
module.exports.check_for_poll_in_db = async(DBConnection, message) => {
    return new Promise((resolve, reject) => {
        DBConnection.query("SELECT poll_channel, poll_mention FROM `discord`.`servers` WHERE `server_id` = '"+message.guild.id+"'", function (error, poll_result) {
            resolve(poll_result);
        });
    });
};

//random
module.exports.collect_message = async(message, msg_filter) => {
    return new Promise((resolve, reject) => {

        message.channel.awaitMessages({
            msg_filter,
            max: 1
        }).then(collected => {
            resolve(collected.first());
        })
        .catch(err => {
            reject(err);
        });

    });
};

module.exports.number_check = async(CheckForOnlyNumbers) => {
    return /^[0-9]+$/.test(CheckForOnlyNumbers);
}

module.exports.check_for_role_mng_perm = async(message) => {
    if(!message.guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
        return false;
    } else {
        return true;
    }
}


//warns
module.exports.check_for_warns_db = async(DBConnection, guild, string, check_no) => {
    return new Promise((resolve,reject) => {
        DBConnection.query("SELECT `enabled_warns` FROM `discord`.`servers` WHERE `server_id` = '"+guild.id+"'", function (error, result) {
            if(error) reject(error);
            if (result[0]["enabled_warns"] == "no") {
                if(check_no == 1) {
                    resolve(result);
                } else {
                    change_warns_in_db(guild,string,DBConnection);
                    create_guild_db_for_warns(DBConnection, guild);
                    resolve(result);
                }
            } else {
                change_warns_in_db(guild,string,DBConnection);
                resolve(result);
            }
        });
    });
}

async function change_warns_in_db(guild, string, DBConnection) {
    DBConnection.query("UPDATE `discord`.`servers` SET `enabled_warns` = '"+string+"' WHERE `server_id` = '"+guild.id+"'");
};

async function create_guild_db_for_warns(DBConnection,guild) {
    DBConnection.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'discord_warns_"+guild.id+"'", function (error, create_result) {
        if (error) return console.log(error);
        if(create_result[0]["COUNT(*)"] == 0) {
            DBConnection.query("CREATE DATABASE `discord_warns_"+guild.id+"`");
        } else return;
    });
};

module.exports.check_if_user_exists_in_db = async(DBConnection, mention, guild) => {

    DBConnection.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'discord_warns_"+guild+"' AND table_name = '"+mention+"'", function (error, mention_result) {
        if(error) console.log(error);
        if(mention_result[0]["COUNT(*)"] == 0) {
            create_member_table_in_db(DBConnection, mention, guild);
        } else return;
    });

};

async function create_member_table_in_db(DBConnection,mention,guild) {
    DBConnection.query("CREATE TABLE `discord_warns_"+guild+"`.`"+mention+"`(`uID` CHAR(8) PRIMARY KEY, `By` CHAR(50) NOT NULL, `reason` VARCHAR(200) NOT NULL)");
};

module.exports.write_warn_data = async(DBConnection, authorID, uID, reason, mentioned, guildID) => {
    DBConnection.query("INSERT INTO `discord_warns_"+guildID+"`.`"+mentioned+"`(`uID`, `By`, `reason`) VALUES ('"+uID+"', '"+authorID+"', '"+reason+"')");
};

module.exports.fetch_warns = async(DBConnection, mentioned, guild) => {
    return new Promise((resolve,reject) => {
        DBConnection.query("SELECT * FROM `discord_warns_"+guild+"`.`"+mentioned+"` LIMIT 10", function (error, fetch_result) {
            if(error) console.log(error);
            resolve(fetch_result);
        });
    });
};

module.exports.check_for_uID = async(DBConnection, mention, guild) => {

    DBConnection.query("SELECT * FROM `discord_warns_"+guild+"`.`"+mention+"` WHERE ˛`uID` = '"+uID+"'", function (error, result_search) {
        if(error) console.log(error);
        resolve(result_search);
    });

};

module.exports.delete_warn_data = async(DBConnection, mention, guild, uID) => {
    DBConnection.query("DELETE FROM `discord_warns_"+guild+"`.`"+mention+"` WHERE `uID` = '"+uID+"'");
}