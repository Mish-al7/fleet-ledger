import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required'],
        index: true,
    },
    invoice_no: {
        type: String,
        required: true,
    },
    booking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
    },
    vehicle_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle is required'],
    },
    customer_name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
    },

    // Odometer
    pick_km: {
        type: Number,
        required: [true, 'Pick KM is required'],
        min: 0,
    },
    drop_km: {
        type: Number,
        required: [true, 'Drop KM is required'],
        min: 0,
    },
    total_km: {
        type: Number,
        required: true,
        min: 0,
    },

    // Time
    start_time: {
        type: Date,
        required: [true, 'Start time is required'],
    },
    end_time: {
        type: Date,
        required: [true, 'End time is required'],
    },
    total_hours: {
        type: Number,
        required: true,
        min: 0,
    },

    // Pricing Rules
    base_hours: {
        type: Number,
        required: true,
        min: 0,
    },
    base_km: {
        type: Number,
        required: true,
        min: 0,
    },
    base_price: {
        type: Number,
        required: true,
        min: 0,
    },
    extra_hour_rate: {
        type: Number,
        required: true,
        min: 0,
    },
    extra_km_rate: {
        type: Number,
        required: true,
        min: 0,
    },

    // Extra Usage
    extra_hours: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    extra_km: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },

    // Totals
    calculated_amount: {
        type: Number,
        required: true,
        min: 0,
    },
    final_amount: {
        type: Number,
        required: true,
        min: 0,
    },
    override_amount: {
        type: Number, // Will hold the provided override amount if final_amount differs from calculated_amount
        min: 0,
    },

    // Audit
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User who created this invoice is required'],
    },
}, {
    timestamps: true,
});

// Invoice number unique per company
InvoiceSchema.index({ invoice_no: 1, company_id: 1 }, { unique: true });

// Static method to generate invoice number
InvoiceSchema.statics.generateInvoiceNo = async function (companyId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Find count of invoices created today for this company
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await this.countDocuments({
        company_id: companyId,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const sequence = String(count + 1).padStart(3, '0');
    return `INV-${dateStr}-${sequence}`;
};

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);

// If the model was already registered but lacks the static method (due to HMR), add it
if (!Invoice.generateInvoiceNo) {
    Invoice.generateInvoiceNo = InvoiceSchema.statics.generateInvoiceNo;
}

export default Invoice;
