import Model from './misc/Model.js';

export default class Library {
    constructor() {
        this._pathToFiles = 'library/';
        this._library = [];
    }

    set library(value) {
        const library = [...value];
        library.sort((a, b) => {
            if (a.bank.toUpperCase() > b.bank.toUpperCase()) return 1;
            if (a.bank.toUpperCase() === b.bank.toUpperCase()) {
                if (a.name.toUpperCase() > b.name.toUpperCase()) return 1;
                if (a.name.toUpperCase() === b.name.toUpperCase()) return 0;
                if (a.name.toUpperCase() < b.name.toUpperCase()) return -1;
            }
            if (a.bank.toUpperCase() < b.bank.toUpperCase()) return -1;
        });
        this._library = library.map((item, i) => ({...item, id: i}));
    }

    getBanks() {
        return this._library.map(item => item.bank).filter((item, i, array) => item !== array[i + 1]);
    }

    getAllPresets() {
        return [...this._library];
    }

    getPresetsByBank(bank) {
        return bank === '' ? this.getAllPresets() : this._library.filter(item => item.bank === bank);
    }

    getPresetById(id) {
        return this._library.find(item => item.id === id);
    }

    getPresetPathById(id) {
        return this._pathToFiles + this.getPresetById(id).fileName;
    }
}
