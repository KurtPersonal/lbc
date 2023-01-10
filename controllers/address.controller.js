const Address = require('../models/address.model');
const Unmap = require('../models/unmap.model');
// 01 02 14 006   REGION PROVINCE/DISTRICT CITY/MUNICIPALITY BARANGAY - 9 DIGIT CODE REFERENCE
//                'Reg'   'Prov' | 'Dist'   'City' | 'Mun'   'Bgy',

const sanitizePsgcCode = (psgcCode) => {
    let desiredLength = 9;
    const trimmedStr = psgcCode.replace(/0+$/g, '');
    const paddedNum = trimmedStr.padEnd(desiredLength, '0');

    return paddedNum;
};

const reverseMapCodes = async (code, current, multiplier, arr) => {
    if (multiplier <= 0) return;
    if (multiplier === 1) multiplier = 0;

    const exponential = Math.pow(10, multiplier);
    const currentCode = Math.floor(code / exponential) * exponential;

    const currentLevel = await Address.findOne({
        CorrespondenceCode: currentCode,
    });

    if (!currentLevel) return;
    if (current === currentCode) return;

    arr.push(currentLevel);
    return reverseMapCodes(code, currentCode, multiplier - 2, arr);
};

exports.reverseMap = async (req, res, next) => {
    const { code } = req.query;
    const addressCodes = [];
    const correspondeCode = sanitizePsgcCode(code);
    await reverseMapCodes(correspondeCode, 0, 7, addressCodes);

    return res.json({ addressCodes });
};

exports.getPickupAddress = async (req, res, next) => {
    try {
        const regex = /\b(pickup|p up|pup|pick up|p\/up|pick-up|pick)\b/i;
        const addresses = await Unmap.find({
            SourceAddress: { $regex: regex },
        });

        return res.json({ length: addresses.length, addresses });
    } catch (err) {
        next(err);
    }
};
