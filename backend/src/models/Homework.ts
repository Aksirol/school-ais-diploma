import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Homework extends Model {
  public id!: number;
  public title!: string;
  public teacher_subject_id!: number;
  public description!: string;
  public due_date!: Date;
  public file_url!: string | null;
  public requires_file!: boolean;
}

Homework.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    teacher_subject_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'teacher_subjects', key: 'id' },
      onDelete: 'CASCADE'
    },
    requires_file: { type: DataTypes.BOOLEAN, defaultValue: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    file_url: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, tableName: 'homework', timestamps: false }
);