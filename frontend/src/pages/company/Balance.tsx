import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { companyAPI } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { 
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell 
} from '../../components/ui/table';
import { Select } from '../../components/ui/select';

interface BalanceData {
  balance: number;
  max_balance: number;
  transactions: Transaction[];
}

interface Transaction {
  id: number;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  company_role: string;
}

const CompanyBalance: React.FC = () => {
  const { id: companyId } = useParams<{ id: string }>();
  const { updateUserBalance } = useAuth();
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'credit_card'
  });
  const [distributionData, setDistributionData] = useState<{[key: number]: string}>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDistributeForm, setShowDistributeForm] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      
      // Fetch company balance
      const balanceResponse = await companyAPI.getBalance(Number(companyId));
      setBalanceData(balanceResponse.data);
      
      // Fetch employees
      const employeesResponse = await companyAPI.getCompanyById(Number(companyId));
      setEmployees(employeesResponse.data.employees);
      
      // Initialize distribution data
      const initialDistribution: {[key: number]: string} = {};
      employeesResponse.data.employees.forEach((employee: Employee) => {
        initialDistribution[employee.id] = '0';
      });
      setDistributionData(initialDistribution);
    } catch (error) {
      console.error('Error fetching company data:', error);
      setError('Failed to load company data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleDistributionChange = (employeeId: number, value: string) => {
    setDistributionData(prevState => ({
      ...prevState,
      [employeeId]: value
    }));
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    setError('');
    setSuccess('');
    
    try {
      setLoading(true);
      await companyAPI.addBalance(Number(companyId), {
        amount: parseInt(formData.amount)
      });
      
      // Reset form and refresh data
      setFormData({
        amount: '',
        payment_method: 'credit_card'
      });
      setShowAddForm(false);
      setSuccess('Баланс успешно пополнен!');
      
      // Refresh company data
      fetchCompanyData();
    } catch (err: any) {
      console.error('Error adding balance:', err);
      setError(err.response?.data?.error || 'Ошибка при пополнении баланса. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !balanceData) return;

    setError('');
    setSuccess('');
    
    // Calculate total distribution
    const totalDistribution = Object.values(distributionData).reduce(
      (sum, value) => sum + parseInt(value || '0'), 0
    );
    
    if (totalDistribution > balanceData.balance) {
      setError(`Нельзя распределить больше доступного баланса (${balanceData.balance} points).`);
      return;
    }
    
    try {
      setLoading(true);
      
      // Distribute balance to each employee
      for (const [employeeId, amount] of Object.entries(distributionData)) {
        const points = parseInt(amount || '0');
        if (points > 0) {
          await companyAPI.addEmployeeBalance(Number(companyId), parseInt(employeeId), {
            amount: points,
            description: 'Распределение баланса сотруднику'
          });
        }
      }
      
      // Reset form and refresh data
      setShowDistributeForm(false);
      setSuccess('Баланс успешно распределен!');
      
      // Обновляем баланс текущего пользователя
      await updateUserBalance();
      
      // Refresh company data
      fetchCompanyData();
    } catch (err: any) {
      console.error('Error distributing balance:', err);
      setError(err.response?.data?.error || 'Ошибка при распределении баланса. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !balanceData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Баланс компании</h1>
        <div className="space-x-2">
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowDistributeForm(false);
            }}
            variant="default"
          >
            {showAddForm ? 'Отмена' : 'Пополнить баланс'}
          </Button>
          <Button
            onClick={() => {
              setShowDistributeForm(!showDistributeForm);
              setShowAddForm(false);
            }}
            variant="secondary"
            disabled={!balanceData?.balance || employees.length === 0}
          >
            {showDistributeForm ? 'Отмена' : 'Распределить баланс'}
          </Button>
        </div>
      </div>
      
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert variant="default">{success}</Alert>}
      
      {/* Balance Overview */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Обзор баланса</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Доступный баланс</h3>
              <p className="text-2xl font-bold text-primary">{balanceData?.balance || 0} points</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Максимальный баланс</h3>
              <p className="text-2xl font-bold">{balanceData?.max_balance || 0} points</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">История транзакций</h3>
              <p className="text-2xl font-bold text-secondary">{balanceData?.transactions.length || 0}</p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Add Balance Form */}
      {showAddForm && (
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Пополнить баланс</h2>
            <form onSubmit={handleAddBalance}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Сумма (points) *
                  </label>
                  <Input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Введите сумму"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Способ оплаты *
                  </label>
                  <Select
                    name="payment_method"
                    value={formData.payment_method}
                    onValueChange={(value) => handleChange({
                      target: { name: 'payment_method', value }
                    } as React.ChangeEvent<HTMLSelectElement>)}
                  >
                    <option value="credit_card">Кредитная карта</option>
                    <option value="bank_transfer">Банковский перевод</option>
                    <option value="paypal">PayPal</option>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Обработка...' : 'Пополнить баланс'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
      
      {/* Distribute Balance Form */}
      {showDistributeForm && (
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Распределить баланс</h2>
            <form onSubmit={handleDistributeBalance}>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Доступный баланс: <span className="font-medium">{balanceData?.balance || 0} points</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Распределите points между сотрудниками. Общая сумма не может превышать доступный баланс.
                </p>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Сотрудник</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Points для распределения</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.company_role}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={distributionData[employee.id] || '0'}
                            onChange={(e) => handleDistributionChange(employee.id, e.target.value)}
                            min="0"
                            max={balanceData?.balance.toString()}
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">
                  Всего к распределению: {Object.values(distributionData).reduce(
                    (sum, value) => sum + parseInt(value || '0'), 0
                  )} points
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={loading || Object.values(distributionData).reduce(
                    (sum, value) => sum + parseInt(value || '0'), 0
                  ) === 0}
                >
                  {loading ? 'Обработка...' : 'Распределить баланс'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
      
      {/* Transaction History */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">История транзакций</h2>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : balanceData?.transactions.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Описание</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceData.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{transaction.transaction_type}</TableCell>
                    <TableCell>{transaction.amount} points</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">История транзакций пуста.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CompanyBalance;
