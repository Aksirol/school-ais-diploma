import { Model, DataTypes } from 'sequelize';
import { sequelize }  from '../config/database';

class HomeworkSubmission extends Model {
  public id!: number;
  public homework_id!: number;
  public student_id!: number;
  public file_url?: string;
  public student_comment?: string;
  public status!: 'submitted' | 'accepted' | 'rejected';
  public teacher_comment?: string;
  public submitted_at!: Date;
}

HomeworkSubmission.init({
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  homework_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  student_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  file_url: { 
    type: DataTypes.STRING, 
    allowNull: true // Може бути порожнім, якщо учень просто написав текст
  },
  student_comment: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  status: { 
    type: DataTypes.ENUM('submitted', 'accepted', 'rejected'), 
    defaultValue: 'submitted' 
  },
  teacher_comment: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  submitted_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, { 
  sequelize, 
  tableName: 'homework_submissions', 
  timestamps: false 
});

export default HomeworkSubmission;