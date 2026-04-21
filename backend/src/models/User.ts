import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class User extends Model {
  public id!: number;
  public last_name!: string;
  public first_name!: string;
  public email!: string;
  public password_hash!: string;
  public role!: 'admin' | 'teacher' | 'student';
  public is_approved!: boolean;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    last_name: { type: DataTypes.STRING, allowNull: false },
    first_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { 
      type: DataTypes.ENUM('admin', 'teacher', 'student'), 
      allowNull: false 
    },
    is_approved: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true, // Автоматично створить created_at та updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);