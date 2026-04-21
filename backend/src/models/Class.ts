import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Class extends Model {
  public id!: number;
  public name!: string;
  public year!: number;
}

Class.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }, // Наприклад: '10-А'
    year: { type: DataTypes.INTEGER, allowNull: false }, // Наприклад: 2026
  },
  { sequelize, tableName: 'classes', timestamps: false }
);