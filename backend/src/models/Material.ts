import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Material extends Model {
  public id!: number;
  public teacher_subject_id!: number;
  public title!: string;
  public type!: 'pdf' | 'ppt' | 'doc' | 'video' | 'link';
  public file_url!: string;
  public uploaded_at!: Date;
}

Material.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    teacher_subject_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'teacher_subjects', key: 'id' },
      onDelete: 'CASCADE'
    },
    title: { type: DataTypes.STRING, allowNull: false },
    type: { 
      type: DataTypes.ENUM('pdf', 'ppt', 'doc', 'video', 'link'), 
      allowNull: false 
    },
    url: { type: DataTypes.STRING, allowNull: false },
  },
  { 
    sequelize, 
    tableName: 'materials', 
    timestamps: true, 
    createdAt: 'uploaded_at',
    updatedAt: false 
  }
);