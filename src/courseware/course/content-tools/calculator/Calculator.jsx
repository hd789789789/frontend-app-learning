import React, { useState } from "react";
import { Collapsible } from "@openedx/paragon";
import { getConfig } from "@edx/frontend-platform";
import { getAuthenticatedHttpClient } from "@edx/frontend-platform/auth";
import { FormattedMessage, useIntl } from "@edx/frontend-platform/i18n";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator, faQuestionCircle, faTimesCircle, faEquals } from "@fortawesome/free-solid-svg-icons";
import messages from "./messages";

const Calculator = () => {
    const intl = useIntl();
    const [equation, setEquation] = useState("");
    const [result, setResult] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const urlEncoded = new URLSearchParams();
        urlEncoded.append("equation", equation);

        const response = await getAuthenticatedHttpClient().get(
            `${getConfig().LMS_BASE_URL}/calculate?${urlEncoded.toString()}`
        );
        setResult(response.data.result);
    };

    const changeEquation = (value) => {
        setEquation(value);
    };

    return (
        <Collapsible.Advanced className="calculator">
            <div className="text-right">
                <Collapsible.Trigger tag="a" className="trigger btn">
                    <Collapsible.Visible whenOpen>
                        <FontAwesomeIcon icon={faTimesCircle} aria-hidden="true" className="mr-2" />
                    </Collapsible.Visible>
                    <Collapsible.Visible whenClosed>
                        <FontAwesomeIcon icon={faCalculator} aria-hidden="true" className="mr-2" />
                    </Collapsible.Visible>
                    {intl.formatMessage(messages["calculator.button.label"])}
                </Collapsible.Trigger>
            </div>
            <Collapsible.Body className="calculator-content pt-4">
                <form onSubmit={handleSubmit} className="container-xl form-inline flex-nowrap">
                    <input
                        type="text"
                        placeholder={intl.formatMessage(messages["calculator.input.field.label"])}
                        aria-label={intl.formatMessage(messages["calculator.input.field.label"])}
                        className="form-control w-100"
                        onChange={(event) => changeEquation(event.target.value)}
                    />
                    <button
                        className="btn btn-primary mx-3"
                        aria-label={intl.formatMessage(messages["calculator.submit.button.label"])}
                        type="submit"
                    >
                        <FontAwesomeIcon icon={faEquals} aria-hidden="true" />
                    </button>
                    <input
                        type="text"
                        tabIndex="-1"
                        readOnly
                        aria-live="polite"
                        placeholder={intl.formatMessage(messages["calculator.result.field.placeholder"])}
                        aria-label={intl.formatMessage(messages["calculator.result.field.label"])}
                        className="form-control w-50"
                        value={result}
                    />
                </form>

                <Collapsible.Advanced>
                    <div className="container-xl">
                        <Collapsible.Trigger className="btn btn-link btn-sm px-0 d-inline-flex align-items-center">
                            <Collapsible.Visible whenOpen>
                                <FontAwesomeIcon icon={faTimesCircle} aria-hidden="true" className="mr-2" />
                            </Collapsible.Visible>
                            <Collapsible.Visible whenClosed>
                                <FontAwesomeIcon icon={faQuestionCircle} aria-hidden="true" className="mr-2" />
                            </Collapsible.Visible>
                            <FormattedMessage
                                id="calculator.instructions.button.label"
                                defaultMessage="Hướng dẫn sử dụng máy tính"
                            />
                        </Collapsible.Trigger>
                    </div>
                    <Collapsible.Body className="container-xl pt-3" style={{ maxHeight: "50vh", overflow: "auto" }}>
                        <FormattedMessage
                            tagName="h6"
                            id="calculator.instructions"
                            defaultMessage="Để biết thông tin chi tiết, hãy xem {expressions_link}."
                            description="Text that precedes the link which redirects to help page calculator"
                            values={{
                                expressions_link: (
                                    <a href={getConfig().SUPPORT_URL_CALCULATOR_MATH}>
                                        <FormattedMessage
                                            id="calculator.instructions.support.title"
                                            defaultMessage="Trung tâm trợ giúp"
                                            description="Anchor text for link which redirects to help page calculator"
                                        />
                                    </a>
                                ),
                            }}
                        />
                        <p>
                            <strong>
                                <FormattedMessage
                                    id="calculator.instructions.useful.tips"
                                    defaultMessage="Mẹo hữu ích:"
                                    description="Headline for the (list of tips) about using the calculator"
                                />
                            </strong>
                        </p>
                        <ul>
                            <li className="hint-item" id="hint-paren">
                                <FormattedMessage
                                    id="calculator.hint1"
                                    defaultMessage="Sử dụng dấu ngoặc đơn () để làm rõ biểu thức. Bạn có thể sử dụng dấu ngoặc đơn bên trong dấu ngoặc đơn khác."
                                    description="The text indicate that the calculator supports parentheses"
                                />
                            </li>
                            <li className="hint-item" id="hint-spaces">
                                <FormattedMessage
                                    id="calculator.hint2"
                                    defaultMessage="Không sử dụng khoảng trắng trong biểu thức."
                                    description="It indicate that using a space might cause un expected behavior"
                                />
                            </li>
                            <li className="hint-item" id="hint-howto-constants">
                                <FormattedMessage
                                    id="calculator.hint3"
                                    defaultMessage="Đối với hằng số, chỉ rõ phép nhân (ví dụ: 5*c)."
                                    description="It indicate the style of math notation"
                                />
                            </li>
                            <li className="hint-item" id="hint-howto-maffixes">
                                <FormattedMessage
                                    id="calculator.hint4"
                                    defaultMessage="Đối với hậu tố, nhập số và hậu tố không có khoảng trắng (ví dụ: 5c)."
                                />
                            </li>
                            <li className="hint-item" id="hint-howto-functions">
                                <FormattedMessage
                                    id="calculator.hint5"
                                    defaultMessage="Đối với hàm, nhập tên hàm, sau đó là biểu thức trong dấu ngoặc đơn."
                                    description="It indicate how to use a math function, e.g. exp(4)."
                                />
                            </li>
                        </ul>
                        <table className="table small">
                            <thead>
                                <tr>
                                    <th scope="col">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.heading"
                                            defaultMessage="Để sử dụng"
                                            description="Column header which indicate  calculator functionality"
                                        />
                                    </th>
                                    <th scope="col">
                                        <FormattedMessage
                                            id="calculator.instruction.table.type.heading"
                                            defaultMessage="Nhập"
                                            description="Column header which indicate the supported type(s) of a the calculator functionality"
                                        />
                                    </th>
                                    <th scope="col">
                                        <FormattedMessage
                                            id="calculator.instruction.table.examples.heading"
                                            defaultMessage="Ví dụ"
                                            description="Column header which list examples of  calculator functionality"
                                        />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th scope="row">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.numbers"
                                            defaultMessage="Số"
                                            description="A calculator functionality"
                                        />
                                    </th>
                                    <td>
                                        <ul className="list-unstyled m-0">
                                            <li>
                                                <FormattedMessage
                                                    id="calculator.instruction.table.to.use.numbers.type1"
                                                    defaultMessage="Số nguyên"
                                                    description="Type of numbers that is supported the calculator"
                                                />
                                            </li>
                                            <li>
                                                <FormattedMessage
                                                    id="calculator.instruction.table.to.use.numbers.type2"
                                                    defaultMessage="Phân số"
                                                    description="Type of numbers that is supported by the calculator"
                                                />
                                            </li>
                                            <li>
                                                <FormattedMessage
                                                    id="calculator.instruction.table.to.use.numbers.type3"
                                                    defaultMessage="Số thập phân"
                                                    description="Type of numbers that is supported by the calculator"
                                                />
                                            </li>
                                        </ul>
                                    </td>
                                    <td dir="auto">
                                        <ul className="list-unstyled m-0">
                                            <li>2520</li>
                                            <li>2/3</li>
                                            <li>3.14, .98</li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.operators"
                                            defaultMessage="Toán tử"
                                            description="A calculator functionality"
                                        />
                                    </th>
                                    <td dir="auto">
                                        <ul className="list-unstyled m-0">
                                            <li>
                                                {" + - * / "}
                                                <FormattedMessage
                                                    id="calculator.instruction.table.to.use.operators.type1"
                                                    defaultMessage="(cộng, trừ, nhân, chia)"
                                                    description="Type of opprators that are supported by the calculator"
                                                />
                                            </li>
                                            <li>
                                                {"^ "}
                                                <FormattedMessage
                                                    id="calculator.instruction.table.to.use.operators.type2"
                                                    defaultMessage="(lũy thừa)"
                                                    description="It indicate that symbol (^) is being used to raise power, e.g. 2^2 = 4"
                                                />
                                            </li>
                                            <li>
                                                {"|| "}
                                                <FormattedMessage
                                                    id="calculator.instruction.table.to.use.operators.type3"
                                                    defaultMessage="(điện trở song song)"
                                                    description="It indicate that the sympol (||) is being used to calculate (parallel resistor), it is a concept in electrical/electronic engineering"
                                                />
                                            </li>
                                        </ul>
                                    </td>
                                    <td dir="auto">
                                        <ul className="list-unstyled m-0">
                                            <li>x+(2*y)/x-1</li>
                                            <li>x^(n+1)</li>
                                            <li>v_IN+v_OUT</li>
                                            <li>1||2</li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.constants"
                                            defaultMessage="Hằng số"
                                            description="It indicate that the calculator support constants, e.g. the speed of light"
                                        />
                                    </th>
                                    <td dir="auto">e, pi</td>
                                    <td dir="auto">
                                        <ul className="list-unstyled m-0">
                                            <li>20*e</li>
                                            <li>418*pi</li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.affixes"
                                            defaultMessage="Hậu tố"
                                        />
                                    </th>
                                    <td dir="auto">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.affixes.type"
                                            defaultMessage="Ký hiệu phần trăm (%)"
                                        />
                                    </td>
                                    <td dir="auto">
                                        <ul className="list-unstyled m-0">
                                            <li>20%</li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.basic.functions"
                                            defaultMessage="Hàm cơ bản"
                                            description="It indicate that calculator supports mathematical function"
                                        />
                                    </th>
                                    <td dir="auto">abs, exp, fact, factorial, ln, log2, log10, sqrt</td>
                                    <td dir="auto">
                                        <ul className="list-unstyled m-0">
                                            <li>abs(x+y)</li>
                                            <li>sqrt(x^2-y)</li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.trig.functions"
                                            defaultMessage="Hàm lượng giác"
                                            description="Type of mathematical function that is supported by the calculator"
                                        />
                                    </th>
                                    <td dir="auto">
                                        <ul className="list-unstyled m-0">
                                            <li>sin, cos, tan, sec, csc, cot</li>
                                            <li>arcsin, sinh, arcsinh</li>
                                        </ul>
                                    </td>
                                    <td dir="auto">
                                        <ul className="list-unstyled m-0">
                                            <li>sin(4x+y)</li>
                                            <li>arccsch(4x+y)</li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.scientific.notation"
                                            defaultMessage="Ký hiệu khoa học"
                                            description="It indicate that calculator supports scientific notation"
                                        />
                                    </th>
                                    <td dir="auto">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.scientific.notation.type1"
                                            defaultMessage="{exponentSyntax} và số mũ"
                                            description="Type of scientific notation that is  supported by the calculator"
                                            values={{
                                                exponentSyntax: "10^",
                                            }}
                                        />
                                    </td>
                                    <td dir="auto">10^-9</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.scientific.notation.type2"
                                            defaultMessage="Ký hiệu {notationSyntax}"
                                            description="It indicate that calculator supports (e) to be used in notation"
                                            values={{
                                                notationSyntax: "e",
                                            }}
                                        />
                                    </th>
                                    <td dir="auto">
                                        <FormattedMessage
                                            id="calculator.instruction.table.to.use.scientific.notation.type3"
                                            defaultMessage="{notationSyntax} và số mũ"
                                            description="An example for using (e) in notation"
                                            values={{
                                                notationSyntax: "1e",
                                            }}
                                        />
                                    </td>
                                    <td dir="auto">1e-9</td>
                                </tr>
                            </tbody>
                        </table>
                    </Collapsible.Body>
                </Collapsible.Advanced>
            </Collapsible.Body>
        </Collapsible.Advanced>
    );
};

export default Calculator;
