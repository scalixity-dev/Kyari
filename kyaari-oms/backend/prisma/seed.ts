import { PrismaClient, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Roles
  console.log('Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with full system access',
    },
  });

  const vendorRole = await prisma.role.upsert({
    where: { name: 'VENDOR' },
    update: {},
    create: {
      name: 'VENDOR',
      description: 'Vendor user with limited access',
    },
  });

  const accountsRole = await prisma.role.upsert({
    where: { name: 'ACCOUNTS' },
    update: {},
    create: {
      name: 'ACCOUNTS',
      description: 'Accounts team member',
    },
  });

  const opsRole = await prisma.role.upsert({
    where: { name: 'OPS' },
    update: {},
    create: {
      name: 'OPS',
      description: 'Operations team member',
    },
  });

  console.log('✅ Roles created');

  // Create Permissions
  console.log('Creating permissions...');
  
  const permissions = [
    // User Management
    { name: 'users:create', resource: 'users', action: 'create', description: 'Create new users' },
    { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
    { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
    { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
    
    // Order Management
    { name: 'orders:create', resource: 'orders', action: 'create', description: 'Create orders' },
    { name: 'orders:read', resource: 'orders', action: 'read', description: 'View orders' },
    { name: 'orders:update', resource: 'orders', action: 'update', description: 'Update orders' },
    { name: 'orders:delete', resource: 'orders', action: 'delete', description: 'Delete orders' },
    
    // Vendor Management
    { name: 'vendors:approve', resource: 'vendors', action: 'approve', description: 'Approve vendors' },
    { name: 'vendors:read', resource: 'vendors', action: 'read', description: 'View vendors' },
    
    // Dispatch Management
    { name: 'dispatch:create', resource: 'dispatch', action: 'create', description: 'Create dispatches' },
    { name: 'dispatch:read', resource: 'dispatch', action: 'read', description: 'View dispatches' },
    
    // GRN Management
    { name: 'grn:create', resource: 'grn', action: 'create', description: 'Create GRNs' },
    { name: 'grn:verify', resource: 'grn', action: 'verify', description: 'Verify GRNs' },
    
    // Finance
    { name: 'finance:read', resource: 'finance', action: 'read', description: 'View financial data' },
    { name: 'finance:approve', resource: 'finance', action: 'approve', description: 'Approve payments' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  console.log('✅ Permissions created');

  // Assign all permissions to ADMIN role
  console.log('Assigning permissions to roles...');
  const allPermissions = await prisma.permission.findMany();
  
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Permissions assigned to ADMIN role');

  // Create Initial Admin User
  console.log('Creating initial admin user...');
  
  const adminEmail = process.env.INIT_ADMIN_EMAIL || 'admin@kyari.com';
  const adminName = process.env.INIT_ADMIN_NAME || 'Admin';
  const adminPassword = process.env.INIT_ADMIN_PASSWORD || 'admin123';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await argon2.hash(adminPassword);
    
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        status: UserStatus.ACTIVE,
        roles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    console.log('✅ Admin user created:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Name: ${adminName}`);
  } else {
    console.log('⚠️  Admin user already exists, skipping...');
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

