/**
 * Formats a string of numbers into a standard US phone number format.
 * @param {string | number} phoneValue - The raw phone number string or number.
 * @returns {string} The formatted phone number.
 */
function formatImportedPhoneNumber(phoneValue) {
    if (!phoneValue) return '';
    
    let digits = phoneValue.toString().replace(/\D/g, '');

    if (digits.length === 11 && digits.startsWith('1')) {
        digits = digits.substring(1);
    }
    
    if (digits.length !== 10) {
        return phoneValue.toString();
    }

    const areaCode = digits.substring(0, 3);
    const middle = digits.substring(3, 6);
    const last = digits.substring(6, 10);

    return `+1 (${areaCode}) ${middle}-${last}`;
}


/**
 * Parses an Excel spreadsheet file to extract a list of client objects.
 * @param {File} file - The spreadsheet file to parse.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of client objects.
 */
export function parseSpreadsheet(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = event.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    throw new Error("Spreadsheet is empty or contains only a header row.");
                }

                const headers = jsonData[0].map(h => h.toString().trim().toLowerCase());
                
                // --- CORRECTED: More robustly finds headers using aliases ---
                const findHeaderIndex = (aliases) => {
                    for (const alias of aliases) {
                        const index = headers.indexOf(alias);
                        if (index > -1) return index;
                    }
                    return -1;
                };

                const headerMapping = {
                    name: findHeaderIndex(['name']),
                    status: findHeaderIndex(['status']),
                    clientSince: findHeaderIndex(['client since']),
                    birthday: findHeaderIndex(['birthday']),
                    age: findHeaderIndex(['age']),
                    email: findHeaderIndex(['email']),
                    phone: findHeaderIndex(['phone', 'phone number']),
                    address: findHeaderIndex(['address', 'mailing address']),
                    assignedHousehold: findHeaderIndex(['assigned household']),
                    feeSchedule: findHeaderIndex(['fee schedule']),
                    riskProfile: findHeaderIndex(['risk profile']),
                    accounts: findHeaderIndex(['accounts']),
                    beneficiaries: findHeaderIndex(['beneficiaries']),
                    notes: findHeaderIndex(['notes']),
                };
                
                if (headerMapping.name === -1) {
                    throw new Error("Spreadsheet must contain a 'Name' column.");
                }

                const clients = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    const clientName = row[headerMapping.name] ? row[headerMapping.name].toString().trim() : '';

                    if (clientName) {
                        const getCellData = (key) => {
                            const index = headerMapping[key];
                            return index > -1 && row[index] ? row[index].toString().trim() : '';
                        };

                        clients.push({
                            name: clientName,
                            status: getCellData('status'),
                            clientSince: getCellData('clientSince'),
                            personal: {
                                birthday: getCellData('birthday'),
                                age: getCellData('age'),
                            },
                            contact: {
                                email: getCellData('email'),
                                phone: formatImportedPhoneNumber(getCellData('phone')),
                                address: getCellData('address'),
                            },
                            financials: {
                                assignedHousehold: getCellData('assignedHousehold'),
                                feeSchedule: getCellData('feeSchedule'),
                                riskProfile: getCellData('riskProfile'),
                            },
                            accounts: getCellData('accounts'),
                            beneficiaries: getCellData('beneficiaries'),
                            notes: getCellData('notes'),
                        });
                    }
                }
                resolve(clients);

            } catch (error) {
                console.error("Error parsing spreadsheet:", error);
                reject(error);
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
}