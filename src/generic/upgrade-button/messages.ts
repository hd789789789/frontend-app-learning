import { defineMessages } from "@edx/frontend-platform/i18n";

const messages = defineMessages({
    srPrices: {
        id: "learning.offer.screenReaderPrices", // historic id
        defaultMessage: "Giá gốc: {originalPrice}, giá giảm: {discountedPrice}",
    },
    srInlinePrices: {
        id: "learning.upgradeButton.screenReaderInlinePrices",
        defaultMessage: "Giá gốc: {originalPrice}",
    },
});

export default messages;
