import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  DataType,
  BeforeUpdate,
  BeforeCreate,
  HasMany,
  BelongsToMany,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull
} from "sequelize-typescript";
import { compare, hash } from "bcryptjs";
import Ticket from "./TicketZPRO";
import Queue from "./QueueZPRO";
import UsersQueue from "./UsersQueuesZPRO";
import Tenant from "./TenantZPRO";
import Contact from "./ContactZPRO";

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  profile: string;
  password?: string;
  passwordHash: string;
  tokenVersion: number;
  status: string;
  lastLogin: Date;
  lastLogout: Date;
  lastOnline: Date;
  isOnline: boolean;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  configs?: object;
}

@Table
class User extends Model<UserAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column
  name!: string;

  @Column
  email!: string;

  @Column
  profile!: string;

  @Column(DataType.VIRTUAL)
  password!: string;

  @Column
  passwordHash!: string;

  @Default(0)
  @Column
  tokenVersion!: number;

  @Default("enabled")
  @Column
  status!: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @HasMany(() => Ticket)
  tickets!: Ticket[];

  @BelongsToMany(() => Queue, () => UsersQueue, "userId", "queueId")
  queues!: Queue[];

  @BelongsToMany(() => Contact, () => Ticket, "userId", "contactId")
  Contact!: Contact[];

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;

  @Column
  lastLogin!: Date;

  @Column
  lastLogout!: Date;

  @Column
  lastOnline!: Date;

  @Column
  isOnline!: boolean;

  @AllowNull
  @Column(DataType.STRING)
  resetPasswordToken?: string;

  @AllowNull
  @Column(DataType.DATE)
  resetPasswordExpires?: Date;

  @Default({})
  @AllowNull
  @Column(DataType.JSON)
  configs?: object;

  @BeforeUpdate
  @BeforeCreate
  static async hashPassword(instance: User): Promise<void> {
    if (instance.password) {
      instance.passwordHash = await hash(instance.password, 10);
    }
  }

  async checkPassword(password: string): Promise<boolean> {
    return compare(password, this.getDataValue("passwordHash"));
  }
}

export default User; 