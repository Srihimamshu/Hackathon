'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATEONLY
      },
      eventName: {
        type: Sequelize.STRING
      },
      speakerName: {
        type: Sequelize.STRING
      },
      target: {
        type: Sequelize.STRING
      },
      NoOfAttendees: {
        type: Sequelize.INTEGER
      },
      confirmed: {
        type: Sequelize.BOOLEAN
      },
      cancelled: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Events');
  }
};