import BaseSelectField from "./BaseSelectField";

export default function ScrollSelectField({ searchable = true, ...props }) {
  return <BaseSelectField searchable={searchable} {...props} />;
}
