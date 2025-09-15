import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Company {
  id: number;
  name: string;
  category: string;
  description: string;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  phone_number: string;
  tracking_url: string;
  status: string;
}

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [generatingLinks, setGeneratingLinks] = useState<number[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchCompanies();
  }, [selectedCategory, searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/companies/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get('/companies', { params });
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLink = async (companyId: number) => {
    setGeneratingLinks(prev => [...prev, companyId]);
    try {
      const response = await axios.post('/links/generate', { companyId });
      alert(`リンクが生成されました！\n\nURL: ${response.data.generated_url}\n電話番号: ${response.data.phone_number || 'なし'}`);
    } catch (error) {
      console.error('Failed to generate link:', error);
      alert('リンクの生成に失敗しました');
    } finally {
      setGeneratingLinks(prev => prev.filter(id => id !== companyId));
    }
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
          <h2 className="card-title">提携企業一覧</h2>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            className="form-input"
            placeholder="企業名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">すべてのカテゴリ</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">読み込み中...</div>
      ) : companies.length === 0 ? (
        <div className="empty-state">
          <h3>企業が見つかりません</h3>
          <p>検索条件を変更してお試しください</p>
        </div>
      ) : (
        <div className="company-grid">
          {companies.map(company => (
            <div key={company.id} className="company-card">
              <h3 className="company-name">{company.name}</h3>
              <span className="company-category">{company.category}</span>
              <p className="company-description">{company.description}</p>
              <div className="company-commission">
                報酬: {formatCommission(company.commission_rate, company.commission_type)}
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={() => generateLink(company.id)}
                disabled={generatingLinks.includes(company.id)}
              >
                {generatingLinks.includes(company.id) ? '生成中...' : 'アフィリエイトリンクを生成'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Companies;