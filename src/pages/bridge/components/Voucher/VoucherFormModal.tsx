import { Dialog } from '@headlessui/react';
import Modal from 'components/Modal';
import { useWalletProvider } from 'context/WalletProvider';
import { Formik } from 'formik';
import { IoMdClose } from 'react-icons/io';
import { useMutation, useQueryClient } from 'react-query';

interface IVoucherFormProps {
  handleFormSubmit: (email: string) => void;
}

function VoucherForm({ handleFormSubmit }: IVoucherFormProps) {
  return (
    <Formik
      initialValues={{ email: '' }}
      validate={values => {
        const errors: {
          email?: string;
        } = {};
        if (!values.email) {
          errors.email = 'Email is required';
        } else if (
          !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
        ) {
          errors.email = 'Enter a valid email address';
        }
        return errors;
      }}
      onSubmit={(values, { setSubmitting }) => {
        setSubmitting(false);
        handleFormSubmit(values.email);
      }}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting,
        /* and other goodies */
      }) => (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="email"
              name="email"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.email}
              className="h-12 w-full rounded-md border border-gray-400 px-4 focus:border-gray-600 focus-visible:outline-none"
            />
            <span className="px-4 text-xs text-red-400">
              {errors.email && touched.email && errors.email}
            </span>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 w-auto rounded-md bg-hyphen-purple px-4 text-white"
          >
            Submit
          </button>
        </form>
      )}
    </Formik>
  );
}

interface IVoucherFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  voucherCode: number | undefined;
}

function VoucherFormModal({
  isVisible,
  onClose,
  voucherCode,
}: IVoucherFormModalProps) {
  const queryClient = useQueryClient();
  const { accounts, signer } = useWalletProvider()!;

  const {
    isError: redeemVoucherError,
    isLoading: redeemVoucherLoading,
    mutate: redeemVoucherMutation,
  } = useMutation(
    ({
      email,
      signedMessage,
    }: {
      email: string;
      signedMessage: string | undefined;
    }) => {
      return fetch('/api/v1/data/verify-and-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          milestoneCode: voucherCode,
          signedMessage,
          walletAddress: accounts?.[0],
        }),
      });
    },
  );

  async function handleFormSubmit(email: string) {
    const signedEmail = await signer?.signMessage(email);
    redeemVoucherMutation(
      { email, signedMessage: signedEmail },
      {
        onSuccess: onRedeemVoucherSuccess,
      },
    );
  }

  function onRedeemVoucherSuccess() {
    queryClient.invalidateQueries();
    onClose();
  }

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <div className="relative rounded-3xl bg-white p-6 shadow-2xl">
        <div className="absolute -inset-2 -z-10 rounded-3xl bg-white/60 opacity-50 blur-lg"></div>
        <div className="flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title
              as="h1"
              className="p-2 text-xl font-semibold text-black text-opacity-[0.54]"
            >
              Enter your email
            </Dialog.Title>
            <button onClick={onClose} className="rounded hover:bg-gray-100">
              <IoMdClose className="h-6 w-auto text-gray-500" />
            </button>
          </div>

          <VoucherForm handleFormSubmit={handleFormSubmit} />
        </div>
      </div>
    </Modal>
  );
}

export default VoucherFormModal;
