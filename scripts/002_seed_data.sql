-- 插入初始部门数据
INSERT INTO departments (name, code, manager, phone, email, sort_order, status, description) VALUES
('总经办', 'CEO', '张三', '010-12345678', 'ceo@company.com', 1, 'active', '公司最高管理部门'),
('技术部', 'TECH', '李四', '010-23456789', 'tech@company.com', 2, 'active', '负责技术研发'),
('市场部', 'MARKET', '王五', '010-34567890', 'market@company.com', 3, 'active', '负责市场营销'),
('人力资源部', 'HR', '赵六', '010-45678901', 'hr@company.com', 4, 'active', '负责人力资源管理');

-- 插入技术部子部门
INSERT INTO departments (name, code, parent_id, manager, phone, email, sort_order, status, description) VALUES
('前端组', 'TECH-FE', 2, '钱七', '010-56789012', 'fe@company.com', 1, 'active', '前端开发团队'),
('后端组', 'TECH-BE', 2, '孙八', '010-67890123', 'be@company.com', 2, 'active', '后端开发团队');

-- 插入初始权限数据
INSERT INTO permissions (name, code, type, sort_order, status, description) VALUES
-- 部门管理权限
('部门查看', 'dept:view', 'menu', 1, 'active', '查看部门列表'),
('部门新增', 'dept:add', 'button', 2, 'active', '新增部门'),
('部门编辑', 'dept:edit', 'button', 3, 'active', '编辑部门'),
('部门删除', 'dept:delete', 'button', 4, 'active', '删除部门'),
-- 用户管理权限
('用户查看', 'user:view', 'menu', 5, 'active', '查看用户列表'),
('用户新增', 'user:add', 'button', 6, 'active', '新增用户'),
('用户编辑', 'user:edit', 'button', 7, 'active', '编辑用户'),
('用户删除', 'user:delete', 'button', 8, 'active', '删除用户'),
-- 角色管理权限
('角色查看', 'role:view', 'menu', 9, 'active', '查看角色列表'),
('角色新增', 'role:add', 'button', 10, 'active', '新增角色'),
('角色编辑', 'role:edit', 'button', 11, 'active', '编辑角色'),
('角色删除', 'role:delete', 'button', 12, 'active', '删除角色'),
-- 权限管理权限
('权限查看', 'perm:view', 'menu', 13, 'active', '查看权限列表'),
('权限新增', 'perm:add', 'button', 14, 'active', '新增权限'),
('权限编辑', 'perm:edit', 'button', 15, 'active', '编辑权限'),
('权限删除', 'perm:delete', 'button', 16, 'active', '删除权限'),
-- 菜单管理权限
('菜单查看', 'menu:view', 'menu', 17, 'active', '查看菜单列表'),
('菜单新增', 'menu:add', 'button', 18, 'active', '新增菜单'),
('菜单编辑', 'menu:edit', 'button', 19, 'active', '编辑菜单'),
('菜单删除', 'menu:delete', 'button', 20, 'active', '删除菜单');

-- 插入初始角色数据
INSERT INTO roles (name, code, sort_order, status, description) VALUES
('超级管理员', 'admin', 1, 'active', '拥有系统所有权限'),
('部门经理', 'manager', 2, 'active', '部门管理员权限'),
('普通员工', 'employee', 3, 'active', '基础查看权限');

-- 为超级管理员角色分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- 为部门经理角色分配查看权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE code LIKE '%:view';

-- 插入初始用户数据 (密码使用简单哈希，实际应用中应该使用 bcrypt)
INSERT INTO users (username, password, real_name, email, phone, department_id, status) VALUES
('admin', '$2a$10$rZ5R3b8Y2Ql6tV8xQ.6bROvGF2Js0eXvP9Eq6mW5pN3hL1kJ8fZ4K', '系统管理员', 'admin@company.com', '13800138000', 1, 'active'),
('manager', '$2a$10$rZ5R3b8Y2Ql6tV8xQ.6bROvGF2Js0eXvP9Eq6mW5pN3hL1kJ8fZ4K', '张经理', 'manager@company.com', '13800138001', 2, 'active'),
('employee', '$2a$10$rZ5R3b8Y2Ql6tV8xQ.6bROvGF2Js0eXvP9Eq6mW5pN3hL1kJ8fZ4K', '李员工', 'employee@company.com', '13800138002', 5, 'active');

-- 为用户分配角色
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- admin 用户分配超级管理员角色
(2, 2), -- manager 用户分配部门经理角色
(3, 3); -- employee 用户分配普通员工角色

-- 插入初始菜单数据
INSERT INTO menus (name, path, icon, parent_id, type, permission_code, sort_order, status) VALUES
('仪表板', '/dashboard', 'LayoutDashboard', NULL, 'menu', NULL, 1, 'active'),
('系统管理', NULL, 'Settings', NULL, 'directory', NULL, 2, 'active'),
('开发管理', NULL, 'Code', NULL, 'directory', NULL, 3, 'active');

-- 插入系统管理子菜单
INSERT INTO menus (name, path, icon, parent_id, type, permission_code, sort_order, status) VALUES
('部门管理', '/dashboard/departments', 'Building2', 2, 'menu', 'dept:view', 1, 'active'),
('用户管理', '/dashboard/users', 'Users', 2, 'menu', 'user:view', 2, 'active'),
('角色管理', '/dashboard/roles', 'Shield', 2, 'menu', 'role:view', 3, 'active'),
('权限管理', '/dashboard/permissions', 'Key', 2, 'menu', 'perm:view', 4, 'active');

-- 插入开发管理子菜单
INSERT INTO menus (name, path, icon, parent_id, type, permission_code, sort_order, status) VALUES
('菜单管理', '/dashboard/menus', 'Menu', 3, 'menu', 'menu:view', 1, 'active');
