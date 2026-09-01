import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `                <button
                  type="button"
                  onClick={() => handleSaveBlogCMS('PUBLISHED')}
                  className="admin-primary-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <CheckCircle2 size={16} />
                  {editingBlog ? 'Update & Publish' : 'Publish Article Live'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}`,
  `                <button
                  type="button"
                  onClick={() => handleSaveBlogCMS('PUBLISHED')}
                  className="admin-primary-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <CheckCircle2 size={16} />
                  {editingBlog ? 'Update & Publish' : 'Publish Article Live'}
                </button>
              </div>
            </div>
          </div>
      )}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Removed extra closing div in blog modal');
