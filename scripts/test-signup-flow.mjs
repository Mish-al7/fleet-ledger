import dbConnect from '../src/lib/dbConnect.js';
import Company from '../src/models/Company.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

async function test() {
    console.log('--- Starting Verification Script ---');
    await dbConnect();

    const testEmail = 'test-company-1@example.com';
    const testAdminEmail = 'admin-1@example.com';

    try {
        // 1. Cleanup old test data
        await User.deleteOne({ email: testAdminEmail });
        await Company.deleteOne({ email: testEmail });
        console.log('✓ Cleaned up old test data');

        // 2. Test registration logic (simulated)
        console.log('Testing Registration...');
        const company = await Company.create({
            name: 'Test Company 1',
            email: testEmail,
            plan: 'basic',
            // status should default to pending_approval
        });

        if (company.status !== 'pending_approval') {
            throw new Error(`Company status should be pending_approval, but got: ${company.status}`);
        }
        console.log('✓ Company created with pending_approval status');

        const hashedPassword = await bcrypt.hash('password123', 12);
        const user = await User.create({
            name: 'Test Admin',
            email: testAdminEmail,
            password: hashedPassword,
            role: 'admin',
            company_id: company._id,
        });
        console.log('✓ Admin user created');

        // 3. Test Auth Logic (simulated authorize callback logic)
        console.log('Testing Auth Logic...');
        const authedUser = await User.findOne({ email: testAdminEmail }).populate('company_id');

        // This simulates the logic in lib/auth.js
        const checkAuth = (u) => {
            if (u.role !== 'super_admin' && u.company_id) {
                if (u.company_id.status === 'suspended') {
                    return 'ACCOUNT_SUSPENDED';
                }
                if (u.company_id.status === 'pending_approval') {
                    return 'PENDING_APPROVAL';
                }
            }
            return 'SUCCESS';
        };

        const result1 = checkAuth(authedUser);
        if (result1 !== 'PENDING_APPROVAL') {
            throw new Error(`Auth should return PENDING_APPROVAL for pending company, but got: ${result1}`);
        }
        console.log('✓ Auth correctly blocked pending company');

        // 4. Test Approval
        console.log('Testing Approval...');
        await Company.findByIdAndUpdate(company._id, { status: 'active' });
        const authedUser2 = await User.findOne({ email: testAdminEmail }).populate('company_id');
        const result2 = checkAuth(authedUser2);
        if (result2 !== 'SUCCESS') {
            throw new Error(`Auth should return SUCCESS for active company, but got: ${result2}`);
        }
        console.log('✓ Auth allowed active company');

        // 5. Test Suspension
        console.log('Testing Suspension...');
        await Company.findByIdAndUpdate(company._id, { status: 'suspended' });
        const authedUser3 = await User.findOne({ email: testAdminEmail }).populate('company_id');
        const result3 = checkAuth(authedUser3);
        if (result3 !== 'ACCOUNT_SUSPENDED') {
            throw new Error(`Auth should return ACCOUNT_SUSPENDED for suspended company, but got: ${result3}`);
        }
        console.log('✓ Auth correctly blocked suspended company');

        console.log('\n--- VERIFICATION SUCCESSFUL ---');

    } catch (error) {
        console.error('\n✖ VERIFICATION FAILED:', error.message);
    } finally {
        // Cleanup
        await User.deleteOne({ email: testAdminEmail });
        await Company.deleteOne({ email: testEmail });
        mongoose.connection.close();
    }
}

test();
