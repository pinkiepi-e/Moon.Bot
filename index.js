const { Client, Intents, Collection, MessageEmbed } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const config = require("./config/config.json");
const mysql = require('mysql');
const fs = require("fs");

client.commands = new Collection();
client.aliases = new Collection();
client.description = new Collection();
client.usage = new Collection();

const CannotUseInDM = ["ban", "boop", "delete", "hug", "info", "kick", "nick", "pin", "poll", "rr", "serverinfo", "unban"];
const DBConnection = mysql.createPool(config.mysql, {multipleStatements: true});
const serverfunctions = require("./functions/server.js");
const experience = require("./functions/experience.js");

fs.readdir("./prikazy/", (err, files) => {
    if(err) console.error(err);

    let jsfile = files.filter(f => f.endsWith('.js'));
    if(jsfile.length <= 0) return console.log("Nenašol som žiaden príkazy.");

    jsfile.forEach((f) => {
        let prikaz = require(`./prikazy/${f}`);
        console.log(`Loaded: ${f}`);
        
        client.commands.set(prikaz.help.name, prikaz);
        if(prikaz.help.aliases) {
            prikaz.help.aliases.forEach(alias => {
                client.aliases.set(alias, prikaz.help.name);
            });
        }
    });
});

client.once("ready", () => {
    client.user.setActivity("By Pinkamena Diane Song");
    client.channels.cache.get("833625728310444042").send("**"+client.user.username+"** --> Online & Up\n**MySQL**: Connected");
    console.log(client.user.username+" -> Online");
});

client.on('messageCreate', async message => {
	if (message.author.bot) return;

    const check_if_levels_are_enabled = await serverfunctions.check_if_levels_are_enabled(DBConnection, message);
    if(check_if_levels_are_enabled[0]["enabled_levels"] == "yes") {
        experience.gen_exp(DBConnection, message);
    }
    const prefix_check = await serverfunctions.get_prefix_from_db(DBConnection, message);
    
    if(/<@!746409149507567632> prefix|<@746409149507567632> prefix/.test(message.content)) {
        let PrefixReply = new MessageEmbed()
            .setColor("#F9A3BB")
            .setTitle('Prefix')
            .setDescription("**"+message.guild.name+"** --> `"+prefix_check+"`");
        return message.channel.send({ embeds: [PrefixReply]});
    }

    if(!message.content.startsWith(prefix_check) && !message.content.startsWith(config.client.prefix)) return;
    
    var args = message.content.slice(prefix_check.length).trim().split(" ");
    let commandName = args.shift().toLowerCase();
    let command = client.commands.get(commandName);
    command_log(client, message, commandName);

    if(!command) command = client.commands.get(client.aliases.get(commandName));
    if(!command) return;

    commandName = command.help.name;
    if(CannotUseInDM.includes(commandName) && message.channel.type == "dm") return message.channel.send("Command **"+commandName+"** cannot be used in Direct Messages");
    command.run(client, message, args, DBConnection, prefix_check);
});

client.on("guildCreate", (guild) => {
    serverfunctions.guildjoin(guild, DBConnection, client, message);
});

client.on("guildDelete", (guild) => {
    serverfunctions.guildleave(guild, DBConnection, client);
});

function command_log(client, message, commandName) {
    client.channels.cache.get("833625728310444042").send("Server Name: "+message.guild.name+"\nServer ID: "+message.guild.id+"\nCommand: "+commandName);
}

client.login(config.client.token);