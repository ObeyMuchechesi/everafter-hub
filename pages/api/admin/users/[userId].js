import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  const { userId } = req.query;

  if (req.method === 'PUT') {
    const { email, full_name, company_name, phone, role, password } = req.body;

    try {
      let updateQuery;
      let params;

      if (password) {
        updateQuery = `
          UPDATE users 
          SET email = $1, full_name = $2, company_name = $3, phone = $4, role = $5, password = $6
          WHERE id = $7 RETURNING *
        `;
        params = [email, full_name, company_name || '', phone || '', role || 'user', password, userId];
      } else {
        updateQuery = `
          UPDATE users 
          SET email = $1, full_name = $2, company_name = $3, phone = $4, role = $5
          WHERE id = $6 RETURNING *
        `;
        params = [email, full_name, company_name || '', phone || '', role || 'user', userId];
      }

      const result = await query(updateQuery, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ user: result.rows[0] });
    } catch (error) {
      console.error('Update user failed', error);
      return res.status(500).json({ error: 'Unable to update user' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete user failed', error);
      return res.status(500).json({ error: 'Unable to delete user' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
