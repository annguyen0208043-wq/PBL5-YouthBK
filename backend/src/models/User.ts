import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class User extends Model {
  declare id: number;
  declare name: string;
  declare fullName: string;
  declare email: string;
  declare password: string;
  declare role: 'admin' | 'lienchi' | 'student';
  declare phone: string | null;
  declare avatar: string | null;
  declare studentId: string | null;
  declare department: string | null;
  declare faculty: string | null;
  declare status: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fullName: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('name');
      },
      set(value: string) {
        this.setDataValue('name', value);
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'lienchi', 'student'),
      defaultValue: 'student',
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    studentId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    faculty: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Hoạt động'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    charset: 'utf8mb4'
  }
);

export default User;
