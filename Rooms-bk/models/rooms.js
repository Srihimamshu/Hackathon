'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Rooms extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Rooms.hasMany(models.Events, {
        foreignKey: "roomId",
      });
    }
    static addRoom({ roomNo }) {
      return this.create({ roomNo});
    }
    static getRooms() {
      return this.findAll();
    }

    static findRooms(allRooms,roomId) {
      const Availrooms = allRooms.filter(
        (allRooms) => allRooms.id != roomId
      );
      return Availrooms;
    }

  }
  Rooms.init({
    roomNo: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Rooms',
  });
  return Rooms;
};