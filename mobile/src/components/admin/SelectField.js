import BaseSelectField from "./BaseSelectField";

export default function SelectField(props) {
  return <BaseSelectField searchable={false} {...props} />;
}
