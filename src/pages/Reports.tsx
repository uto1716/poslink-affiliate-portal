import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ReportData {
  summary: {
    total_conversions: number;
    total_revenue: number;
    total_commission: number;
    approved_commission: number;
    pending_commission: number;
  };
  data: any[];
  period: {
    start: string;
    end: string;
  };
}

interface MonthlyData {
  month: string;
  conversions: number;
  revenue: number;
  commission: number;
}

const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'custom' | 'monthly'>('custom');

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(lastMonth.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyReport();
    }
  }, [activeTab]);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert('期間を選択してください');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get('/reports/generate', {
        params: { startDate, endDate }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      alert('レポートの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/reports/monthly');
      setMonthlyData(response.data);
    } catch (error) {
      console.error('Failed to fetch monthly report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (!startDate || !endDate) {
      alert('期間を選択してください');
      return;
    }

    try {
      const response = await axios.get('/reports/generate', {
        params: { startDate, endDate, format: 'csv' },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `report-${startDate}-${endDate}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download CSV:', error);
      alert('CSVダウンロードに失敗しました');
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">レポート</h2>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button
            className={`btn ${activeTab === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('custom')}
            style={{ marginRight: '10px' }}
          >
            カスタムレポート
          </button>
          <button
            className={`btn ${activeTab === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('monthly')}
          >
            月次レポート
          </button>
        </div>

        {activeTab === 'custom' && (
          <>
            <div className="filter-bar">
              <div className="form-group">
                <label className="form-label">開始日</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">終了日</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={fetchReport}
                  disabled={isLoading}
                >
                  {isLoading ? 'レポート生成中...' : 'レポート生成'}
                </button>

                <button
                  className="btn btn-success"
                  onClick={downloadCSV}
                  disabled={isLoading || !reportData}
                  style={{ marginLeft: '10px' }}
                >
                  CSVダウンロード
                </button>
              </div>
            </div>

            {reportData && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">総成約数</div>
                    <div className="stat-value">{reportData.summary.total_conversions}</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">総売上</div>
                    <div className="stat-value">{formatCurrency(reportData.summary.total_revenue)}</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">総報酬</div>
                    <div className="stat-value success">{formatCurrency(reportData.summary.total_commission)}</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">承認済報酬</div>
                    <div className="stat-value success">{formatCurrency(reportData.summary.approved_commission)}</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">保留中報酬</div>
                    <div className="stat-value warning">{formatCurrency(reportData.summary.pending_commission)}</div>
                  </div>
                </div>

                {reportData.data.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">詳細データ</h3>
                    </div>

                    <table className="table">
                      <thead>
                        <tr>
                          <th>成約日時</th>
                          <th>企業名</th>
                          <th>カテゴリ</th>
                          <th>売上</th>
                          <th>報酬</th>
                          <th>ステータス</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.data.map((item: any) => (
                          <tr key={item.id}>
                            <td>{new Date(item.converted_at).toLocaleString()}</td>
                            <td>{item.company_name}</td>
                            <td>{item.category}</td>
                            <td>{formatCurrency(item.revenue)}</td>
                            <td>{formatCurrency(item.commission)}</td>
                            <td>
                              <span className={`status ${item.status}`}>
                                {item.status === 'approved' && '承認済'}
                                {item.status === 'pending' && '保留中'}
                                {item.status === 'rejected' && '却下'}
                                {item.status === 'paid' && '支払済'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'monthly' && (
          <>
            {isLoading ? (
              <div className="loading">読み込み中...</div>
            ) : monthlyData.length > 0 ? (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">月次レポート（過去12ヶ月）</h3>
                </div>

                <table className="table">
                  <thead>
                    <tr>
                      <th>年月</th>
                      <th>成約数</th>
                      <th>売上</th>
                      <th>報酬</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((data, index) => (
                      <tr key={index}>
                        <td>{data.month}</td>
                        <td>{data.conversions}</td>
                        <td>{formatCurrency(data.revenue)}</td>
                        <td>{formatCurrency(data.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <h3>月次データがありません</h3>
                <p>成約が発生すると、ここに月次レポートが表示されます</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;