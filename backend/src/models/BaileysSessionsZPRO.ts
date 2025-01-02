import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  Default
} from "sequelize-typescript";
import WhatsappZPRO from "./WhatsappZPRO";

@Table
export default class BaileysSessions extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Default(null)
  @Column
  value!: string;

  @Default(null)
  @Column
  name!: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @ForeignKey(() => WhatsappZPRO)
  @Column
  whatsappId!: number;
} 