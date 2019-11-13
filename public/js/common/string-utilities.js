export function capitalize(str) {
    if (!str || !str.length) return str;

    return str[0].toUpperCase() +  str.substr(1);
}