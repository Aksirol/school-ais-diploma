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
    class_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  day_of_week: {            // ЗАМІНЕНО З weekday
    type: DataTypes.INTEGER, 
    allowNull: false,
  },
  lesson_number: {          // ЗАМІНЕНО З start_time
    type: DataTypes.INTEGER,
    allowNull: false,
  },
    room: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, tableName: 'schedule', timestamps: false }
);