const Unmap = require('../models/unmap.model');
const Address = require('../models/address.model');
const fs = require('fs/promises');

const getAllBarangaysStartingWith = async (code) => {
    const psgcCode = +code.slice(0, 7);
    const barangays = await Address.find({
        $where: `this.PsgcCode.toString().match(/^${psgcCode}/)`,
    });
    let filterBarangays = barangays.filter((address) => {
        return address.PsgcCode !== +code;
    });
    return filterBarangays;
};

const filterString = (str) => {
    if (str.match(/princesa/i)) return '(?<!puerto\\s)princesa';
    return str.replace('(Pob.)', '').replace('ñ', '[n|ñ]').trim();
};

const checkArrayInText = (text, barangaysToMatch) => {
    if (barangaysToMatch === '') return undefined;
    const regex = new RegExp(`\\b(${barangaysToMatch})\\b`, 'ig');

    return text.match(regex)?.[0];
};

const getAllBarangays = async (source, code) => {
    try {
        const addresses = await getAllBarangaysStartingWith(code);
        const barangaysToMatch = addresses
            .reduce(
                (output, string) =>
                    output + filterString(string.Name.toString()) + '|',
                ''
            )
            .slice(0, -1);

        const newAddress = source.map((address) => {
            return {
                ...address._doc,
                NewBarangay: checkArrayInText(
                    address.SourceAddress.replace(
                        /brg.?[y|y.]?|barangay/i,
                        'Barangay'
                    ).replace(/\b(sta).?\s/i, 'Santa '),
                    barangaysToMatch
                ),
            };
        });

        return newAddress;
    } catch (err) {
        throw err;
    }
};

exports.getAllBarangaysOfThisCity = async (req, res, next) => {
    try {
        const { code, Barangay, Region } = req.query;

        const barangays = await Unmap.find({
            Barangay,
            Region,
        });

        const allBarangaysCode = await getAllBarangays(barangays, code);

        const NullBarangay = allBarangaysCode.filter((brgy) => {
            return brgy.NewBarangay === undefined;
        });

        const NotNullBarangay = allBarangaysCode.filter((brgy) => {
            return brgy.NewBarangay !== undefined;
        });

        const barangayList = Array.from(
            new Set(NotNullBarangay.map((address) => address.NewBarangay))
        )?.sort();

        const data = {
            Total: NullBarangay.length + NotNullBarangay.length,
            NullCount: NullBarangay.length,
            NewCount: NotNullBarangay.length,
            barangayList,
            NullBarangay,
            NotNullBarangay,
        };
        await fs.writeFile(`./Unmapped/${Barangay}.json`, JSON.stringify(data));

        return res.json(data);
    } catch (err) {
        next(err);
    }
};

exports.getAllNCRAddress = async (req, res, next) => {
    const { region } = req.query;
    try {
        const ncrAddresses = await Unmap.find({
            Barangay: 'Santo Nino',
        });

        let cities = ncrAddresses.map((address) => {
            return address.City;
        });

        let barangays = ncrAddresses.map((address) => {
            return address.Barangay;
        });

        let barangaysWithCities = ncrAddresses.map((address) => {
            return {
                TrackingNumber: address.TrackingNumber,
                Source: address.SourceAddress,
                Barangay: address.Barangay,
                City: address.City,
            };
        });

        let citySet = Array.from(new Set(cities));
        let barangaySet = Array.from(new Set(barangays));

        let BarangayPerCity = citySet.map((city) => {
            return barangaysWithCities.filter((add) => {
                return add.City === city;
            });
        });

        const CountBarangaysPerCity = BarangayPerCity.map((city) => {
            return barangaySet.map((brgy) => {
                return {
                    BarangayName: brgy,
                    NumberOfBarangaysUnmapped: city.filter((br) => {
                        return br.Barangay === brgy;
                    }).length,
                    SourceAddress: city.filter((br) => {
                        return br.Barangay === brgy;
                    }),
                };
            });
        });

        const removeNotCounted = CountBarangaysPerCity.map((add) => {
            return add
                .filter((notcounted) => {
                    return notcounted.NumberOfBarangaysUnmapped !== 0;
                })
                .sort((a, b) => {
                    return (
                        b.NumberOfBarangaysUnmapped -
                        a.NumberOfBarangaysUnmapped
                    );
                });
        });

        const UnmappedCity = citySet.map((city) => {
            return {
                City: city,
                Length: ncrAddresses.filter((unmap) => {
                    return unmap.City === city;
                }).length,
            };
        });

        const total = UnmappedCity.reduce((total, city) => {
            return total + city.Length;
        }, 0);

        const UnmappedPerCity = {
            UnmappedNCRTotal: ncrAddresses.length,
            UnmappedCity,
            OverAllTotal: total,
        };

        return res.json(removeNotCounted);
    } catch (err) {
        next(err);
    }
};
