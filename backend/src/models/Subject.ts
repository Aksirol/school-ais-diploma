import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Subject extends Model {
  public id!: number;
  public name!: string;
}

Subject.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { sequelize, tableName: 'subjects', timestamps: false }
);