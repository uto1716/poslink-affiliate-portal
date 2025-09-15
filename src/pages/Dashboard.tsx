import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
  pendingCommission: number;
  recentConversions: any[];
  topPerformingLinks: any[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [period, setPeriod] = useState('7days');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsResponse, chartResponse] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/dashboard/chart-data', { params: { period } })
      ]);

      setStats(statsResponse.data);
      setChartData(chartResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  if (isLoading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (!stats) {
    return <div className="empty-state">データの読み込みに失敗しました</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">ダッシュボード</h2>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">総リンク数</div>
          <div className="stat-value">{stats.totalLinks}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">総クリック数</div>
          <div className="stat-value">{stats.totalClicks}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">総成約数</div>
          <div className="stat-value">{stats.totalConversions}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">確定報酬</div>
          <div className="stat-value success">{formatCurrency(stats.totalCommission)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">保留中報酬</div>
          <div className="stat-value warning">{formatCurrency(stats.pendingCommission)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">総売上</div>
          <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">成約推移</h3>
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7days">過去7日間</option>
            <option value="30days">過去30日間</option>
            <option value="90days">過去90日間</option>
          </select>
        </div>

        {chartData.length > 0 ? (
          <div style={{ padding: '20px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>成約数</th>
                  <th>報酬</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((data, index) => (
                  <tr key={index}>
                    <td>{data.date}</td>
                    <td>{data.conversions}</td>
                    <td>{formatCurrency(data.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>この期間のデータはありません</p>
          </div>
        )}
      </div>

      {stats.topPerformingLinks.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">トップパフォーマンスリンク</h3>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>企業名</th>
                <th>報酬タイプ</th>
                <th>クリック数</th>
                <th>成約数</th>
                <th>成約率</th>
              </tr>
            </thead>
            <tbody>
              {stats.topPerformingLinks.map((link: any) => (
                <tr key={link.id}>
                  <td>{link.company_name}</td>
                  <td>
                    {link.commission_type === 'percentage'
                      ? `${link.commission_rate}%`
                      : formatCurrency(link.commission_rate)}
                  </td>
                  <td>{link.clicks}</td>
                  <td>{link.conversions}</td>
                  <td>
                    {link.clicks > 0
                      ? `${((link.conversions / link.clicks) * 100).toFixed(1)}%`
                      : '0%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats.recentConversions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">最近の成約</h3>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>日時</th>
                <th>企業名</th>
                <th>売上</th>
                <th>報酬</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentConversions.map((conversion: any) => (
                <tr key={conversion.id}>
                  <td>{new Date(conversion.converted_at).toLocaleString()}</td>
                  <td>{conversion.company_name}</td>
                  <td>{formatCurrency(conversion.revenue)}</td>
                  <td>{formatCurrency(conversion.commission)}</td>
                  <td>
                    <span className={`status ${conversion.status}`}>
                      {conversion.status === 'approved' && '承認済'}
                      {conversion.status === 'pending' && '保留中'}
                      {conversion.status === 'rejected' && '却下'}
                      {conversion.status === 'paid' && '支払済'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;