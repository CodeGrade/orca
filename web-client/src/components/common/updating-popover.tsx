import React, { useEffect } from "react";
import Popover, { PopoverProps } from "react-bootstrap/Popover";

const UpdatingPopover = React.forwardRef<HTMLDivElement, PopoverProps>(
  ({ popper, children, title, show: _, ...props }, ref) => {
    useEffect(() => {
      // TODO: Figure out what this means
      if (popper) popper.scheduleUpdate();
    }, [children, popper]);

    return (
      <Popover ref={ref} {...props}>
        <Popover.Header className="text-center">{title}</Popover.Header>
        <Popover.Body>{children}</Popover.Body>
      </Popover>
    );
  }
);
export default UpdatingPopover;
