const Discord = require("discord.js");
const mysql = require("mysql");
const config = require("./config.json");
const bot = new Discord.Client();
const token = config.info.token
const prefix = config.info.prefix
const lang = config.info.lang

bot.login(token)

var connection = mysql.createConnection({
    host     : config.info.database.host,
    user     : config.info.database.user,
    password : config.info.database.password,
    database : config.info.database.database
});

connection.connect();

types = {
    "identity" : "SELECT * FROM vrp_user_identities WHERE user_id = ",
    "moneys" : "SELECT * FROM vrp_user_moneys WHERE user_id = ",
    "userdata" : "SELECT * FROM vrp_user_data WHERE user_id =",
    "biler" : "SELECT * FROM vrp_user_vehicles WHERE user_id =" 
}

function getData(type, userid, cb){
    if(types[type]){
        var sql = types[type]
        connection.query(sql + userid, function(err, result, fields){
            if(err) throw err;
            cb(result)
        })
    }
}

function returnData(message,id){
    connection.query("SELECT * FROM vrp_user_ids WHERE identifier LIKE '%" + id.toString() + "';", function(error, result, fields){
        if(error) throw error;
        if(result[0]){
            var userid = result[0].user_id
            getData("moneys", userid, function(moneys){
                getData("identity", userid, function(identity){
                    getData("userdata", userid, function(usrdata){
                        var parsedData = JSON.parse(usrdata[0].dvalue)
                        const returnData = {
                            color: 0x1207eb,
                            author: {
                                name: config[lang].title,
                                icon_url: 'https://cdn.discordapp.com/avatars/264759509820506112/bc7c1c3908c4f794d0eeb4f596bccba0.png'
                            },
                            description: '',
                            fields: [
                                {
                                    name: config[lang].result.stats.name,
                                    value: identity[0].firstname + " " + identity[0].name,
                                },
                                {
                                    name: config[lang].result.stats.age,
                                    value: identity[0].age,
                                },
                                {
                                    name: config[lang].result.stats.registration,
                                    value: identity[0].registration,
                                },
                                {
                                    name: config[lang].result.stats.moneywallet,
                                    value: moneys[0].wallet,
                                },
                                {
                                    name: config[lang].result.stats.moneybank,
                                    value: moneys[0].bank,
                                },
                                {
                                    name: config[lang].result.stats.health,
                                    value: parsedData.health / 2 + "%"
                                },
                                {
                                    name: config[lang].result.stats.drinkandfood,
                                    value: parsedData.thirst.toFixed(2) + "% " + config[lang].result.stats.and + " " + parsedData.hunger.toFixed(2) + "%"
                                },
                            ],
                            timestamp: new Date(),
                            footer: {
                                text: config[lang].tag
                            },
                        };
                        message.reply({embed: returnData})
                    })
                })
            })
        } else {
            message.reply(config[lang].error)
        }
    })
}

function returnBiler(message, id){
    connection.query("SELECT * FROM vrp_user_ids WHERE identifier LIKE '%" + id.toString() + "';", function(error, result, fields){
        if(error) throw error;
        if(result[0]){
            var userid = result[0].user_id
            getData("biler", userid, function(bilerne){
                const fields = bilerne.map((enbil) => {
                    return {
                        name: enbil.vehicle,
                        value: config[lang].result.cars.type + enbil.veh_type + " \n" + config[lang].result.cars.plate + enbil.vehicle_plate
                    }
                });
                const returnData = {
                    color: 0x1207eb,
                    author: {
                        name: 'Server Statistik',
                        icon_url: 'https://cdn.discordapp.com/avatars/264759509820506112/bc7c1c3908c4f794d0eeb4f596bccba0.png'
                    },
                    description: '',
                    fields: fields,
                    timestamp: new Date(),
                    footer: {
                        text: config[lang].tag
                    },
                };
                message.reply({embed: returnData})

            })
        }
    })
}

function returnInventory(message, id){
    connection.query("SELECT * FROM vrp_user_ids WHERE identifier LIKE '%" + id.toString() + "';", function(error, result, fields){
        if(error) throw error;
        if(result[0]){
            var userid = result[0].user_id
            getData("userdata", userid, function(data){
                parsedData = JSON.parse(data[0].dvalue)
                var weaponkeys = Object.keys(parsedData.weapons)
                let allWeapons = ""
                for(i = 0; i < weaponkeys.length; i++){
                    var navn = weaponkeys[i].replace("WEAPON_", "")
                    allWeapons = allWeapons + navn[0] + navn.slice(1).toLocaleLowerCase() + " ｜ " + parsedData.weapons[weaponkeys[i]].ammo + "\n"
                }
                var itemKeys = Object.keys(parsedData.inventory)
                let allItems = ""
                for(i = 0; i < itemKeys.length; i++){
                    allItems = allItems + itemKeys[i][0].toUpperCase() + itemKeys[i].slice(1) + " ｜ " + parsedData.inventory[itemKeys[i]].amount + "\n"
                }
                const returnData = {
                    color: 0x1207eb,
                    author: {
                        name: 'Server Statistik',
                        icon_url: 'https://cdn.discordapp.com/avatars/264759509820506112/bc7c1c3908c4f794d0eeb4f596bccba0.png'
                    },
                    description: '',
                    fields: [
                        {
                            name: config[lang].result.inventory.weapons,
                            value: allWeapons
                        },
                        {
                            name: config[lang].result.inventory.items,
                            value: allItems
                        }
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: config[lang].tag
                    },
                };
                message.reply({embed: returnData})
            })
        }
    })
}

bot.on("message", function(message){
    if(message.content.startsWith(prefix + config[lang].commands.stats)){
        if(!message.mentions.users.first()){
            returnData(message, message.member.user.id)
        } else {
            returnData(message, message.mentions.users.first().id)
        }
    } else if(message.content.startsWith(prefix + config[lang].commands.cars)){
        if(!message.mentions.users.first()){
            returnBiler(message, message.member.user.id)
        } else {
            returnBiler(message, message.mentions.users.first().id)
        }
    } else if(message.content.startsWith(prefix + config[lang].commands.inventory)){
        returnInventory(message, message.member.user.id)
    }
})