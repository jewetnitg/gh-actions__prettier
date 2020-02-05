type Parser<T> = (v: string, defaultValue?: T) => T | null;

const parser = <T>(parser: Parser<T>) => (defaultValue?: T): Parser<T> => v => {
    const value = parser(v, defaultValue);

    if (value == null) {
        if (defaultValue == null) {
            return null;
        }

        return defaultValue;
    }

    return value;
};

export const string = parser((v: string) => v);
export const stringarray = parser(str => str.split("\n").filter(Boolean));
export const object = parser(<T>(v: string, defaultValue?: T) =>
    v ? { ...(defaultValue || {}), ...(JSON.parse(v) as T) } : null,
);
export const array = parser(<T>(v: string) =>
    v ? (JSON.parse(v) as T) : null,
);
export const boolean = parser((v: string) =>
    v ? v === "true" || v === "1" : null,
);
export const date = parser((v: string) => (v ? new Date(v) : null));
