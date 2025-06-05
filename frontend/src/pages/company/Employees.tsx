import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { companyAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell 
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Alert } from '../../components/ui/alert';
import { Dialog } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  email: string;
  company_role: 'owner' | 'admin' | 'manager' | 'employee';
  date_added: string;
}

// Функция генерации пароля
const generatePassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const CompanyEmployees: React.FC = () => {
  const { id: companyId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: generatePassword(), // Генерируем пароль при инициализации
    company_role: 'employee' as 'owner' | 'admin' | 'manager' | 'employee'
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');

  // Добавляем эффект для отслеживания изменений employees
  useEffect(() => {
    if (employees.length > 0 && user?.id) {
      const currentEmployee = employees.find(emp => emp.id === user.id);
      if (currentEmployee) {
        console.log('Setting current user role from employees change:', currentEmployee.company_role);
        setCurrentUserRole(currentEmployee.company_role);
      }
    }
  }, [employees, user?.id]);

  const fetchEmployees = React.useCallback(async () => {
    if (!companyId) {
      setError('Идентификатор компании обязателен');
      return;
    }

    try {
      const response = await companyAPI.getCompanyById(Number(companyId));
      const employeesData = response.data.employees;
      
      console.log('Fetched data:', {
        userId: user?.id,
        employeesCount: employeesData.length,
        employees: employeesData
      });

      // Находим роль текущего пользователя в компании
      const currentEmployee = employeesData.find((emp: any) => emp.id === user?.id);
      console.log('Current employee:', currentEmployee);

      if (currentEmployee) {
        console.log('Setting current user role from fetch:', currentEmployee.company_role);
        setCurrentUserRole(currentEmployee.company_role);
      } else {
        console.log('Current employee not found in employees list');
        setCurrentUserRole(null);
      }

      setEmployees(employeesData);
      setError('');
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(err.response?.data?.error || 'Ошибка при загрузке сотрудников');
    } finally {
      setLoading(false);
    }
  }, [companyId, user?.id]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Для отладки - временно добавим вывод информации о правах
  useEffect(() => {
    console.log('User permissions updated:', {
      userId: user?.id,
      company_role: user?.company_role,
      currentUserRole,
      canManageEmployees: currentUserRole === 'owner' || currentUserRole === 'admin' || currentUserRole === 'manager'
    });
  }, [user, currentUserRole]);

  // Проверяем, имеет ли пользователь права на управление сотрудниками
  const canManageEmployees = currentUserRole === 'owner' || currentUserRole === 'admin' || currentUserRole === 'manager';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageEmployees) {
      setError('У вас нет прав на добавление сотрудников');
      return;
    }

    if (!user?.role) {
      setError('Не удалось определить роль текущего пользователя');
      return;
    }

    const generatedPassword = formData.password; // Сохраняем пароль перед сбросом формы

    try {
      await companyAPI.addEmployee({
        email: formData.email,
        name: formData.name,
        password: formData.password,
        role: user.role,
        company_role: formData.company_role,
        company_id: Number(companyId)
      });

      setSuccess(`Сотрудник успешно добавлен! Пароль для входа: ${generatedPassword}`);
      setShowAddForm(false);
      setShowPassword(false);
      setFormData({
        email: '',
        name: '',
        password: generatePassword(),
        company_role: 'employee'
      });

      // Обновляем список сотрудников
      await fetchEmployees();
    } catch (err: any) {
      console.error('Error adding employee:', err);
      setError(err.response?.data?.error || 'Ошибка при добавлении сотрудника');
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!canManageEmployees) {
      setError('У вас нет прав на удаление сотрудников');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      return;
    }

    try {
      await companyAPI.removeEmployee(employeeId);
      setSuccess('Сотрудник успешно удален');
      
      // Обновляем список сотрудников
      await fetchEmployees();
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      setError(err.response?.data?.error || 'Ошибка при удалении сотрудника');
    }
  };

  const handleResetPassword = async (employeeId: number) => {
    if (!canManageEmployees) {
      setError('У вас нет прав на сброс пароля сотрудников');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите сбросить пароль этого сотрудника?')) {
      return;
    }

    try {
      const response = await companyAPI.resetEmployeePassword(Number(companyId), employeeId);
      setResetPasswordSuccess(`Новый пароль сотрудника: ${response.data.new_password}`);
      
      // Очистим сообщение об успехе через 30 секунд
      setTimeout(() => {
        setResetPasswordSuccess('');
      }, 30000);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.response?.data?.error || 'Ошибка при сбросе пароля');
    }
  };

  // Если у пользователя нет прав на управление сотрудниками, закрываем форму добавления
  useEffect(() => {
    if (!canManageEmployees && showAddForm) {
      setShowAddForm(false);
    }
  }, [canManageEmployees, showAddForm]);

  const handleShowAddForm = () => {
    setFormData({
      ...formData,
      password: generatePassword() // Генерируем новый пароль при открытии формы
    });
    setShowAddForm(true);
  };

  // Обновляем обработчик отмены
  const handleCancel = () => {
    setShowAddForm(false);
    setShowPassword(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Сотрудники компании</h1>
        {canManageEmployees && (
          <button
            onClick={handleShowAddForm}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Добавить сотрудника
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {resetPasswordSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {resetPasswordSuccess}
        </div>
      )}
      
      {showAddForm && canManageEmployees && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Добавить сотрудника</h2>
          <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль (сгенерирован автоматически)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  readOnly
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Сохраните этот пароль, он будет показан только один раз
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Роль в компании
              </label>
              <select
                name="company_role"
                value={formData.company_role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="employee">Сотрудник</option>
                <option value="manager">Менеджер</option>
                {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                  <option value="admin">Администратор</option>
                )}
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
              >
                Добавить
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : employees.length > 0 ? (
        <Card>
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Дата добавления</TableHead>
                  {canManageEmployees && (
                    <TableHead className="text-right">Действия</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.company_role}</TableCell>
                    <TableCell>{new Date(employee.date_added).toLocaleDateString()}</TableCell>
                    {canManageEmployees && (
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleResetPassword(employee.id)}
                        >
                          Сбросить пароль
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          Удалить
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-gray-500 mb-4">В компании пока нет сотрудников.</p>
          {canManageEmployees && (
            <Button
              onClick={handleShowAddForm}
            >
              Добавить первого сотрудника
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};

export default CompanyEmployees;
