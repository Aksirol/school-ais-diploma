import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class TeacherSubject extends Model {
  public id!: number;
  public teacher_id!: number;
  public subject_id!: number;
  public class_id!: number;
}

TeacherSubject.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    teacher_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },
    subject_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'subjects', key: 'id' },
      onDelete: 'CASCADE'
    },
    class_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'classes', key: 'id' },
      onDelete: 'RESTRICT' // Не можна видалити клас, якщо він використовується в teacher_subjects
    },
  },
  { 
    sequelize, 
    tableName: 'teacher_subjects', 
    timestamps: false,
    indexes: [{ unique: true, fields: ['teacher_id', 'subject_id', 'class_id'] }]
  }
);