import React from "react";
import { Flex, Type, Tooltip } from "blockstack-ui/dist";
import LockOpenIcon from "mdi-react/LockOpenIcon";
import NewBoxIcon from "mdi-react/NewBoxIcon";
import QrCode from "mdi-react/QrcodeIcon";
import SendIcon from "mdi-react/SendIcon";
import { Hover } from "react-powerplug";
import { TxDetailsModal } from "@containers/modals/tx";
import { OpenModal } from "@components/modal";
import dayjs from "dayjs";
import { btcToStx } from "@common/lib/addresses";

const getIcon = (item, stx) => {
  const { operation, sender, recipient } = item;
  if (sender && sender.stx) {
    if (sender.stx === stx) {
      return SendIcon;
    } else {
      return QrCode;
    }
  }
  switch (operation) {
    case "SENT":
      return SendIcon;
    case "RECEIVED":
      return QrCode;
    case "UNLOCK":
      return LockOpenIcon;
    default:
      return NewBoxIcon;
  }
};
export const TypeIcon = ({ item, stx, size = 48, ...rest }) => {
  const Icon = getIcon(item, stx);
  return (
    <Flex
      border={1}
      borderColor="blue.mid"
      size={size}
      borderRadius={size}
      alignItems="center"
      justifyContent="center"
      bg="white"
      flexShrink={0}
      {...rest}
    >
      <Icon size={size / 2.5} style={{ display: "block" }} />
    </Flex>
  );
};
const Item = ({ last, length, ...rest }) => (
  <Hover>
    {({ hovered, bind }) => (
      <Flex
        borderBottom={!last || length < 3 ? "1px solid" : undefined}
        borderColor={!last || length < 3 ? "blue.mid" : undefined}
        alignItems="center"
        flexShrink={0}
        flexGrow={length > 3 ? 1 : 0}
        bg={hovered ? "hsl(202, 40%, 97.5%)" : "white"}
        cursor={hovered ? "pointer" : undefined}
        px={4}
        py={4}
        {...rest}
        {...bind}
      />
    )}
  </Hover>
);
const Date = ({ date, ...rest }) =>
  date ? (
    <Flex
      title={dayjs(date).format("DD MMMM YYYY")}
      pr={4}
      flexDirection={"column"}
      alignItems={"center"}
    >
      <Type fontSize={1} fontWeight="bold">
        {dayjs(date)
          .format("MMM")
          .toUpperCase()}
      </Type>
      <Type color="hsl(205, 30%, 70%)" fontSize={3}>
        {dayjs(date).format("DD")}
      </Type>
    </Flex>
  ) : null;
const getTitle = (item, stx) => {
  const { operation, sender, recipient } = item;
  if (sender && sender.stx) {
    if (sender.stx === stx) {
      return `Sent Stacks`;
    } else {
      return `Received Stacks`;
    }
  }
  switch (operation) {
    case "SENT":
      return "Sent Stacks";
    case "RECEIVED":
      return "Received Stacks";
    case "UNLOCK":
      return "Stacks Unlocked";
    default:
      return operation;
  }
};

const getSubtitle = (item, stx) => {
  const { operation, sender, recipient, senderBitcoinAddress } = item;

  if (sender && sender.stx) {
    if (sender.stx === stx) {
      return `To ${recipient}`;
    } else {
      return `From ${sender.stx}`;
    }
  }
  if (operation === "SENT") {
    return `To ${recipient}`;
  }
  if (operation === "RECEIVED") {
    return `From ${btcToStx(senderBitcoinAddress)}`;
  }
};

const Details = ({ operation, recipient, pending, item, stx, ...rest }) => (
  <Flex flexDirection={"column"} flexGrow={1} maxWidth="100%" overflow="hidden">
    <Type pb={1} display={"inline-flex"} alignItems="center" fontWeight={500}>
      {getTitle(item, stx)}
      {pending ? (
        <Type
          ml={2}
          bg="blue.mid"
          lineHeight="1rem"
          borderRadius={6}
          py={"1px"}
          px={"5px"}
          fontSize={"9px"}
          letterSpacing="1px"
        >
          PENDING
        </Type>
      ) : null}
    </Type>
    <Type
      overflow="hidden"
      maxWidth="100%"
      style={{
        whiteSpace: "nowrap",
        textOverflow: "ellipsis"
      }}
      fontSize={1}
      color="hsl(205, 30%, 70%)"
    >
      {getSubtitle(item, stx)}
    </Type>
  </Flex>
);

const Amount = ({ value, ...rest }) => (
  <Flex
    style={{
      whiteSpace: "nowrap"
    }}
    textAlign="right"
    {...rest}
  >
    <Type>
      {value} <Type color="hsl(205, 30%, 70%)">STX</Type>
    </Type>
  </Flex>
);

const TxItem = ({ last, item, length, stx, ...rest }) => {
  const {
    operation,
    recipient,
    blockTime,
    pending,
    valueStacks,
    tokenAmountReadable,
    time
  } = item;
  return (
    <OpenModal
      component={({ hide, visible }) => (
        <TxDetailsModal hide={hide} tx={item} stx={stx} />
      )}
    >
      {({ bind }) => (
        <Item {...bind} last={last} length={length}>
          {blockTime || time ? <Date date={blockTime || time * 1000} /> : null}
          <TypeIcon mr={3} item={item} stx={stx} />
          <Details
            pending={pending}
            operation={operation}
            recipient={recipient}
            item={item}
            stx={stx}
          />
          <Amount ml={3} value={valueStacks || tokenAmountReadable} />
        </Item>
      )}
    </OpenModal>
  );
};

export { TxItem };
