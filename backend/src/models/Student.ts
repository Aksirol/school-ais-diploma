import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Student extends Model {
  public id!: number;
  public user_id!: number;
  public class_id!: number;
}

Student.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },
    class_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'classes', key: 'id' },
      onDelete: 'RESTRICT' // Не можна видалити клас, якщо в ньому є учні
    },
  },
  { 
    sequelize, 
    tableName: 'students', 
    timestamps: false,
    indexes: [{ unique: true, fields: ['user_id'] }] // Один учень - один запис
  }
);