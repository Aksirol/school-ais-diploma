import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Attendance extends Model {
  public id!: number;
  public student_id!: number;
  public teacher_subject_id!: number;
  public lesson_date!: Date;
  public status!: 'present' | 'absent' | 'late';
  public reason!: string | null;
}

Attendance.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    student_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'students', key: 'id' },
      onDelete: 'CASCADE'
    },
    teacher_subject_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'teacher_subjects', key: 'id' },
      onDelete: 'CASCADE'
    },
    lesson_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { 
      type: DataTypes.ENUM('present', 'absent', 'late'), 
      allowNull: false 
    },
    reason: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, tableName: 'attendance', timestamps: false }
);