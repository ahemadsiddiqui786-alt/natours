/* eslint-disable */
class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);
        
        // Convert nested operators and numeric values
        const processObj = (obj) => {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    // Handle operators like { gte: '500' } -> { $gte: 500 }
                    const processed = {};
                    for (const [op, val] of Object.entries(value)) {
                        if (['gte', 'gt', 'lte', 'lt'].includes(op)) {
                            processed['$' + op] = isNaN(val) ? val : Number(val);
                        } else {
                            processed[op] = val;
                        }
                    }
                    result[key] = processed;
                } else {
                    result[key] = value;
                }
            }
            return result;
        };
        
        const processedQuery = processObj(queryObj);
        this.query.find(processedQuery);
        return this;
    }
    sort() {
        if (this.queryString.sort) {
            const sortStr = Array.isArray(this.queryString.sort) 
                ? this.queryString.sort.join(',') 
                : this.queryString.sort;
            const sortBy = sortStr.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }
    limitFields() {
        if (this.queryString.fields) {
            const fieldsStr = Array.isArray(this.queryString.fields)
                ? this.queryString.fields.join(',')
                : this.queryString.fields;
            const fields = fieldsStr.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }
    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
