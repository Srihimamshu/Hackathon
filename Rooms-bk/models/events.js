'use strict';
const {
  Model
} = require('sequelize');
const { Op } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Events extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Events.belongsTo(models.Persons, {
        foreignKey: "userId",
      });
      Events.belongsTo(models.Rooms, {
        foreignKey: "roomId",
      });
    }
    static addEvent({ eventName,date,speakerName,target,NoOfAttendees,userId,roomId,confirmed,cancelled }) {
      return this.create({ eventName,date,speakerName,target,NoOfAttendees,userId,roomId,confirmed,cancelled});
    }
    static findEvents(date) {
      return this.findAll({
        where: {
          date,
          confirmed:true,
          cancelled:false
        },
      });
    }
    static getEvents(){
      return this.findAll({
        where:{
        confirmed:false,
        cancelled:false
        }
      }) 
    }
    static getConfirmedEvents(){
      return this.findAll({
        where:{
        confirmed:true,
        cancelled:false
        }
      }) 
    }

    static UserCreatedEvents(userId){
      return this.findAll({
        where:{
        userId,
        cancelled:false
        }
      }) 
    }

    static ConfirmEvents(TotalEvents) {
      return TotalEvents.filter(
        (TotalEvents) => TotalEvents.date >=  new Date().toISOString().slice(0, 10)
      );
    }


    static setConfirmedStatus (event,value) {
      return event.update({ confirmed: value })
    }

    static setCancel (event,value) {
      return event.update({ cancelled: value })
    }
  }
  Events.init({
    date: DataTypes.DATEONLY,
    eventName: DataTypes.STRING,
    speakerName: DataTypes.STRING,
    target: DataTypes.STRING,
    NoOfAttendees: DataTypes.INTEGER,
    confirmed: DataTypes.BOOLEAN,
    cancelled: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Events',
  });
  return Events;
};