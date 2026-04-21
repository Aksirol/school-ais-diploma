import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Message extends Model {
  public id!: number;
  public sender_id!: number;
  public receiver_id!: number;
  public content!: string;
  public is_read!: boolean;
  public sent_at!: Date;
}

Message.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sender_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },
    receiver_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },
    content: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { 
    sequelize, 
    tableName: 'messages', 
    timestamps: true, 
    createdAt: 'sent_at',
    updatedAt: false 
  }
);