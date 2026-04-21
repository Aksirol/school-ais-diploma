import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Grade extends Model {
  public id!: number;
  public student_id!: number;
  public teacher_subject_id!: number;
  public grade_date!: Date;
  public value!: number;
  public comment!: string | null;
}

Grade.init(
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
    grade_date: { type: DataTypes.DATEONLY, allowNull: false },
    value: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      validate: { min: 1, max: 12 } // 12-бальна система
    },
    comment: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, tableName: 'grades', timestamps: false }
);