import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Schedule extends Model {
  public id!: number;
  public teacher_subject_id!: number;
  public weekday!: number; 
  public start_time!: string; 
  public room!: string; 
}

Schedule.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    teacher_subject_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'teacher_subjects', key: 'id' },
      onDelete: 'CASCADE'
    },
    weekday: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      validate: { min: 1, max: 5 } // Лише будні дні
    },
    start_time: { type: DataTypes.TIME, allowNull: false },
    room: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, tableName: 'schedule', timestamps: false }
);