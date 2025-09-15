import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AffiliateLink {
  id: number;
  user_id: number;
  company_id: number;
  tracking_code: string;
  phone_number: string | null;
  generated_url: string;
  clicks: number;
  conversions: number;
  created_at: string;
  company_name: string;
  category: string;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
}

const MyLinks: React.FC = () => {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchMyLinks();
  }, []);

  const fetchMyLinks = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/links/my-links');
      setLinks(response.data);
    } catch (error) {
      console.error('Failed to fetch links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, linkId: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(linkId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const formatCommission = (rate: number, type: 'percentage' | 'fixed') => {
    if (type === 'percentage') {
      return `${rate}%`;
    } else {
      return `¥${rate.toLocaleString()}`;
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">マイアフィリエイトリンク</h2>
        </div>

        {isLoading ? (
          <div className="loading">読み込み中...</div>
        ) : links.length === 0 ? (
          <div className="empty-state">
            <h3>まだリンクがありません</h3>
            <p>提携企業ページから新しいリンクを生成してください</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>企業名</th>
                  <th>カテゴリ</th>
                  <th>報酬</th>
                  <th>クリック数</th>
                  <th>成約数</th>
                  <th>リンク</th>
                  <th>電話番号</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id}>
                    <td>{link.company_name}</td>
                    <td>
                      <span className="company-category">{link.category}</span>
                    </td>
                    <td>{formatCommission(link.commission_rate, link.commission_type)}</td>
                    <td>{link.clicks}</td>
                    <td>{link.conversions}</td>
                    <td>
                      <div className="link-display">
                        {link.generated_url.substring(0, 50)}...
                      </div>
                    </td>
                    <td>
                      {link.phone_number ? (
                        <div className="link-display">
                          {link.phone_number}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn ${copiedId === link.id ? 'btn-success' : 'btn-secondary'} copy-button`}
                        onClick={() => copyToClipboard(link.generated_url, link.id)}
                      >
                        {copiedId === link.id ? 'コピー済み' : 'URLコピー'}
                      </button>
                      {link.phone_number && (
                        <button
                          className="btn btn-secondary copy-button"
                          onClick={() => copyToClipboard(link.phone_number!, link.id * 1000)}
                        >
                          電話番号コピー
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLinks;